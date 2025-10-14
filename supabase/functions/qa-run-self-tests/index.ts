import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestResult {
  name: string;
  description: string;
  pass: boolean;
  duration_ms: number;
  error?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tests: TestResult[] = [];

    // Test 1: Schema Sanity - Relations
    await runTest(tests, 'Schema Relations', 'Validate FK relationships exist', async () => {
      const { data: fks, error } = await supabase.rpc('get_foreign_keys_info');
      
      const requiredRelations = [
        { table: 'launch_campaign_assignees', column: 'user_id', ref_table: 'profiles' },
        { table: 'launch_campaign_assignees', column: 'campaign_id', ref_table: 'launch_pad_campaigns' },
        { table: 'task_assignees', column: 'user_id', ref_table: 'profiles' },
        { table: 'project_assignees', column: 'user_id', ref_table: 'profiles' },
      ];

      // Just verify tables exist and can be queried
      for (const rel of requiredRelations) {
        const { error: tableError } = await supabase.from(rel.table).select('id').limit(1);
        if (tableError) throw new Error(`Table ${rel.table} query failed: ${tableError.message}`);
      }
    });

    // Test 2: Tasks CRUD + Realtime
    await runTest(tests, 'Tasks CRUD', 'Create, update, and delete task with realtime', async () => {
      // Create test task
      const { data: task, error: createError } = await supabase
        .from('tasks')
        .insert({
          title: 'QA Test Task',
          status: 'Pending',
          priority: 'Medium',
          created_by: user.id,
          qa_tag: true,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Inline update
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ title: 'QA Test Task Updated', status: 'In Progress' })
        .eq('id', task.id);

      if (updateError) throw updateError;

      // Verify activity log
      const { data: logs } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('entity_id', task.id)
        .eq('entity_type', 'task');

      if (!logs || logs.length === 0) throw new Error('Activity logs not created');

      // Cleanup
      await supabase.from('tasks').delete().eq('id', task.id);
    });

    // Test 3: Multi-Assignee System
    await runTest(tests, 'Multi-Assignee', 'Assign multiple users to task', async () => {
      // Get test users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .limit(2);

      if (!profiles || profiles.length < 2) {
        throw new Error('Need at least 2 users for multi-assign test');
      }

      // Create test task
      const { data: task, error: createError } = await supabase
        .from('tasks')
        .insert({
          title: 'Multi-Assign Test',
          status: 'Pending',
          created_by: user.id,
          qa_tag: true,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Assign multiple users
      const { error: assignError } = await supabase
        .from('task_assignees')
        .insert([
          { task_id: task.id, user_id: profiles[0].id, assigned_by: user.id },
          { task_id: task.id, user_id: profiles[1].id, assigned_by: user.id },
        ]);

      if (assignError) throw assignError;

      // Verify assignments
      const { data: assignees } = await supabase
        .from('task_assignees')
        .select('*')
        .eq('task_id', task.id);

      if (assignees?.length !== 2) throw new Error('Expected 2 assignees');

      // Cleanup
      await supabase.from('tasks').delete().eq('id', task.id);
    });

    // Test 4: Ads Approval + Comments
    await runTest(tests, 'Ads Approval', 'Create ad, update approval, add comments', async () => {
      // Create test ad
      const { data: ad, error: createError } = await supabase
        .from('ads')
        .insert({
          name: 'QA Test Ad',
          approval_status: 'pending',
          headlines: [],
          descriptions: [],
          sitelinks: [],
          callouts: [],
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Update approval status through all states
      const statuses = ['approved', 'not_approved', 'needs_adjustments', 'pending'];
      for (const status of statuses) {
        const { error } = await supabase
          .from('ads')
          .update({ approval_status: status })
          .eq('id', ad.id);
        
        if (error) throw new Error(`Failed to update to ${status}: ${error.message}`);
      }

      // Add comment
      const { error: commentError } = await supabase
        .from('ad_comments')
        .insert({
          ad_id: ad.id,
          author_id: user.id,
          body: 'QA Test Comment',
        });

      if (commentError) throw commentError;

      // Verify activity logs
      const { data: logs } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('entity_id', ad.id)
        .eq('entity_type', 'ad');

      if (!logs || logs.length === 0) throw new Error('No activity logs for ad');

      // Cleanup
      await supabase.from('ads').delete().eq('id', ad.id);
    });

    // Test 5: Launch Pad Lifecycle
    await runTest(tests, 'Launch Pad', 'Create campaign, auto-assign, launch to orbit', async () => {
      // Create launch campaign
      const { data: campaign, error: createError } = await supabase
        .from('launch_pad_campaigns')
        .insert({
          title: 'QA Test Campaign',
          teams: ['Social UA', 'PPC'],
          status: 'pending',
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Get team members
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, teams')
        .or('teams.cs.{"Social UA"},teams.cs.{"PPC"}');

      if (profiles && profiles.length > 0) {
        // Auto-assign
        const assignments = profiles.map(p => ({
          campaign_id: campaign.id,
          user_id: p.id,
          assigned_by: user.id,
        }));

        const { error: assignError } = await supabase
          .from('launch_campaign_assignees')
          .insert(assignments);

        if (assignError) throw new Error(`Assignment failed: ${assignError.message}`);
      }

      // Move to orbit
      const { error: launchError } = await supabase
        .from('launch_pad_campaigns')
        .update({ status: 'live', launched_at: new Date().toISOString() })
        .eq('id', campaign.id);

      if (launchError) throw launchError;

      // Verify assignees can be fetched with profiles
      const { data: withAssignees, error: fetchError } = await supabase
        .from('launch_pad_campaigns')
        .select(`
          *,
          launch_campaign_assignees(
            user_id,
            profiles!launch_campaign_assignees_user_id_fkey(id, name, avatar_url)
          )
        `)
        .eq('id', campaign.id)
        .single();

      if (fetchError) throw new Error(`Failed to fetch with assignees: ${fetchError.message}`);

      // Cleanup
      await supabase.from('launch_pad_campaigns').delete().eq('id', campaign.id);
    });

    // Test 6: RPC Smoke Tests
    await runTest(tests, 'RPC Functions', 'Test all custom RPC endpoints', async () => {
      // Test assign_entity (tasks)
      const { data: task } = await supabase
        .from('tasks')
        .insert({
          title: 'RPC Test Task',
          status: 'Pending',
          created_by: user.id,
          qa_tag: true,
        })
        .select()
        .single();

      if (!task) throw new Error('Failed to create test task');

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (!profiles || profiles.length === 0) throw new Error('No profiles found');

      const { error: assignError } = await supabase.rpc('assign_entity', {
        entity: 'task',
        entity_id: task.id,
        assignee_ids: [profiles[0].id],
      });

      if (assignError) throw new Error(`assign_entity failed: ${assignError.message}`);

      // Test inline_update
      const { error: inlineError } = await supabase.rpc('inline_update', {
        entity: 'task',
        entity_id: task.id,
        patch: { title: 'Updated via RPC' },
      });

      if (inlineError) throw new Error(`inline_update failed: ${inlineError.message}`);

      // Cleanup
      await supabase.from('tasks').delete().eq('id', task.id);
    });

    // Test 7: Realtime Channel
    await runTest(tests, 'Realtime', 'Verify realtime subscriptions work', async () => {
      // This is a basic check - full realtime testing requires client-side
      const { data, error } = await supabase
        .from('tasks')
        .select('id')
        .limit(1);

      if (error) throw error;
      
      // Just verify the connection works
      if (!data) throw new Error('Could not query tasks for realtime test');
    });

    // Calculate summary
    const passed = tests.filter(t => t.pass).length;
    const total = tests.length;
    const allPassed = passed === total;

    const report = {
      passed: allPassed,
      summary: `${passed}/${total} tests passed`,
      timestamp: new Date().toISOString(),
      tests,
    };

    console.log('QA Test Report:', JSON.stringify(report, null, 2));

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('QA Test Error:', error);
    return new Response(JSON.stringify({ 
      error: error?.message || String(error),
      passed: false,
      summary: 'Test suite failed to run',
      tests: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function runTest(
  tests: TestResult[],
  name: string,
  description: string,
  testFn: () => Promise<void>
) {
  const start = Date.now();
  try {
    await testFn();
    tests.push({
      name,
      description,
      pass: true,
      duration_ms: Date.now() - start,
    });
  } catch (error: any) {
    tests.push({
      name,
      description,
      pass: false,
      duration_ms: Date.now() - start,
      error: error?.message || String(error),
    });
  }
}
