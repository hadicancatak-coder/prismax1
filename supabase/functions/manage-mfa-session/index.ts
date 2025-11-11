import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { randomBytes } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, sessionToken } = await req.json();

    if (action === 'create') {
      // Create new MFA session after successful verification
      const sessionTokenValue = randomBytes(32).toString('hex');
      const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';

      const { error: insertError } = await supabase
        .from('mfa_sessions')
        .insert({
          user_id: user.id,
          session_token: sessionTokenValue,
          ip_address: ipAddress,
          user_agent: userAgent
        });

      if (insertError) {
        console.error('Failed to create MFA session');
        throw new Error('Failed to create session');
      }

      return new Response(
        JSON.stringify({ sessionToken: sessionTokenValue }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'validate') {
      // Validate existing MFA session
      if (!sessionToken) {
        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: session } = await supabase
        .from('mfa_sessions')
        .select('id, expires_at')
        .eq('session_token', sessionToken)
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .single();

      return new Response(
        JSON.stringify({ valid: !!session }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'cleanup') {
      // Cleanup expired sessions
      await supabase
        .from('mfa_sessions')
        .delete()
        .lt('expires_at', new Date().toISOString());

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('Error in manage-mfa-session');
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
