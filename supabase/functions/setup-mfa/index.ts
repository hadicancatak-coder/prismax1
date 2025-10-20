import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import * as OTPAuth from 'https://esm.sh/otpauth@9.2.2';

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

    // Parse request body if present
    let verifyOtp;
    try {
      const body = await req.json();
      verifyOtp = body.verifyOtp;
    } catch {
      // No body provided - this is the initial QR code request
      verifyOtp = undefined;
    }

    // Get or create secret
    let { data: profile } = await supabase
      .from('profiles')
      .select('mfa_secret, email, name')
      .eq('user_id', user.id)
      .single();

    let secret = profile?.mfa_secret;
    
    if (!secret) {
      // Generate new secret (base32, 20 bytes = 160 bits)
      secret = new OTPAuth.Secret({ size: 20 }).base32;
    }

    // If verifying OTP
    if (verifyOtp) {
      const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(secret),
        digits: 6,
        period: 30,
      });

      const isValid = totp.validate({ token: verifyOtp, window: 1 }) !== null;

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid OTP code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate 10 backup codes
      const backupCodes = [];
      for (let i = 0; i < 10; i++) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        backupCodes.push(code);
      }

      // Save to database - store as text array for Postgres
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          mfa_secret: secret,
          mfa_enabled: true,
          mfa_backup_codes: backupCodes,
          mfa_enrolled_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw new Error('Failed to save MFA settings');
      }

      console.log(`MFA enabled for user ${user.id}`);

      return new Response(
        JSON.stringify({ 
          success: true,
          backupCodes: backupCodes
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate TOTP URI
    const totp = new OTPAuth.TOTP({
      issuer: 'Prisma',
      label: profile?.email || user.email || '',
      secret: OTPAuth.Secret.fromBase32(secret),
      digits: 6,
      period: 30,
    });

    const otpauth = totp.toString();

    // Save secret temporarily (not enabled yet)
    await supabase
      .from('profiles')
      .update({ mfa_secret: secret })
      .eq('user_id', user.id);

    return new Response(
      JSON.stringify({
        secret: secret,
        otpauth: otpauth
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in setup-mfa:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
