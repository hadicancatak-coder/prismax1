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

    const { otpCode, isBackupCode } = await req.json();

    // Rate limiting: Check failed attempts in last 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data: recentAttempts } = await supabase
      .from('mfa_verification_attempts')
      .select('id')
      .eq('user_id', user.id)
      .eq('success', false)
      .gte('attempt_time', fifteenMinutesAgo);

    if (recentAttempts && recentAttempts.length >= 5) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many failed attempts. Please try again in 15 minutes.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's MFA data from secure table
    const { data: mfaSecrets } = await supabase
      .from('user_mfa_secrets')
      .select('mfa_secret, mfa_backup_codes')
      .eq('user_id', user.id)
      .single();

    if (!mfaSecrets?.mfa_secret) {
      throw new Error('MFA not set up for this user');
    }

    let isValid = false;

    if (isBackupCode) {
      // Check backup code
      const backupCodes = mfaSecrets.mfa_backup_codes || [];
      isValid = backupCodes.includes(otpCode);

      if (isValid) {
        // Remove used backup code
        const updatedCodes = backupCodes.filter((code: string) => code !== otpCode);
        await supabase
          .from('user_mfa_secrets')
          .update({ mfa_backup_codes: updatedCodes })
          .eq('user_id', user.id);
      }
    } else {
      // Verify TOTP code
      const totp = new OTPAuth.TOTP({
        secret: OTPAuth.Secret.fromBase32(mfaSecrets.mfa_secret),
        digits: 6,
        period: 30,
      });
      
      isValid = totp.validate({ token: otpCode, window: 1 }) !== null;
    }

    // Log attempt
    await supabase
      .from('mfa_verification_attempts')
      .insert({
        user_id: user.id,
        success: isValid,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      });

    if (!isValid) {
      console.log(`Failed MFA attempt for user ${user.id}`);
      return new Response(
        JSON.stringify({ error: 'Invalid code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successful MFA verification for user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in verify-mfa-otp:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
