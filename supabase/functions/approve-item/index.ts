import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApproveRequest {
  entityType: 'task' | 'ad' | 'campaign' | 'launch_campaign';
  entityId: string;
  comment?: string;
  changes?: Record<string, any>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Approve item function started');

    // Create authenticated client to verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('❌ Auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('✅ User authenticated:', user.id);

    // Create service role client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if user has admin role using has_role function
    const { data: isAdmin, error: roleError } = await supabaseAdmin
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    console.log('🔍 Admin check:', { isAdmin, roleError });

    if (roleError) {
      console.error('❌ Role check error:', roleError);
      throw new Error(`Failed to verify admin status: ${roleError.message}`);
    }

    if (!isAdmin) {
      throw new Error('Access denied. Admin role required.');
    }

    console.log('✅ Admin verified');

    // Parse request body
    const body: ApproveRequest = await req.json();
    const { entityType, entityId } = body;

    console.log('📋 Processing approval:', { entityType, entityId });

    // Handle different entity types
    if (entityType === 'task') {
      // Fetch change request
      const { data: changeRequest, error: fetchError } = await supabaseAdmin
        .from('task_change_requests')
        .select('*, payload_json')
        .eq('id', entityId)
        .eq('status', 'pending')
        .single();

      if (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        throw new Error(`Failed to fetch change request: ${fetchError.message}`);
      }

      if (!changeRequest) {
        throw new Error('Change request not found or already processed');
      }

      // Apply changes to task
      const payload = changeRequest.payload_json as any;

      if (changeRequest.type === 'status_change') {
        const { error: updateError } = await supabaseAdmin
          .from('tasks')
          .update({
            status: payload.status,
            failure_reason: payload.failure_reason
          })
          .eq('id', payload.task_id);

        if (updateError) {
          console.error('❌ Task update error:', updateError);
          throw new Error(`Failed to update task: ${updateError.message}`);
        }
        console.log('✅ Task updated');
      }

      // Get profile ID
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Mark as approved
      const { error: approveError } = await supabaseAdmin
        .from('task_change_requests')
        .update({
          status: 'approved',
          decided_by: profile.id,
          decided_at: new Date().toISOString()
        })
        .eq('id', entityId);

      if (approveError) {
        console.error('❌ Approval error:', approveError);
        throw new Error(`Failed to approve request: ${approveError.message}`);
      }

      console.log('✅ Request approved');
    }

    if (entityType === 'ad') {
      const { error: updateError } = await supabaseAdmin
        .from('ads')
        .update({ approval_status: 'approved' })
        .eq('id', entityId);

      if (updateError) {
        console.error('❌ Ad approval error:', updateError);
        throw new Error(`Failed to approve ad: ${updateError.message}`);
      }

      console.log('✅ Ad approved');
    }

    console.log('✅ Approval complete');

    return new Response(
      JSON.stringify({ success: true, message: 'Approved successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('❌ Function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: error.message === 'Unauthorized' ? 401 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
