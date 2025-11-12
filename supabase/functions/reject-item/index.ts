import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RejectRequest {
  entityType: 'task' | 'ad' | 'campaign' | 'launch_campaign';
  entityId: string;
  comment?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Reject item function started');

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
    const body: RejectRequest = await req.json();
    const { entityType, entityId } = body;

    console.log('📋 Processing rejection:', { entityType, entityId });

    // Handle different entity types
    if (entityType === 'task') {
      // Fetch change request
      const { data: changeRequest, error: fetchError } = await supabaseAdmin
        .from('task_change_requests')
        .select('*')
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

      // Get profile ID
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Mark as rejected (don't apply changes)
      const { error: rejectError } = await supabaseAdmin
        .from('task_change_requests')
        .update({
          status: 'rejected',
          decided_by: profile.id,
          decided_at: new Date().toISOString()
        })
        .eq('id', entityId);

      if (rejectError) {
        console.error('❌ Rejection error:', rejectError);
        throw new Error(`Failed to reject request: ${rejectError.message}`);
      }

      console.log('✅ Request rejected');
    }

    if (entityType === 'ad') {
      const { error: updateError } = await supabaseAdmin
        .from('ads')
        .update({ approval_status: 'rejected' })
        .eq('id', entityId);

      if (updateError) {
        console.error('❌ Ad rejection error:', updateError);
        throw new Error(`Failed to reject ad: ${updateError.message}`);
      }

      console.log('✅ Ad rejected');
    }

    console.log('✅ Rejection complete');

    return new Response(
      JSON.stringify({ success: true, message: 'Rejected successfully' }),
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
