import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { authenticator } from 'https://esm.sh/otplib@12.0.1';
import QRCode from 'https://esm.sh/qrcode@1.5.3';

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

    const { verifyOtp } = await req.json();

    // Get or create secret
    let { data: profile } = await supabase
      .from('profiles')
      .select('mfa_secret, email, name')
      .eq('user_id', user.id)
      .single();

    let secret = profile?.mfa_secret;
    
    if (!secret) {
      // Generate new secret
      secret = authenticator.generateSecret();
    }

    // If verifying OTP
    if (verifyOtp) {
      const isValid = authenticator.verify({
        token: verifyOtp,
        secret: secret
      });

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

      // Save to database
      await supabase
        .from('profiles')
        .update({
          mfa_secret: secret,
          mfa_enabled: true,
          mfa_backup_codes: backupCodes,
          mfa_enrolled_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      console.log(`MFA enabled for user ${user.id}`);

      return new Response(
        JSON.stringify({ 
          success: true,
          backupCodes: backupCodes
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate QR code
    const appName = 'Prisma';
    const otpauth = authenticator.keyuri(
      profile?.email || user.email,
      appName,
      secret
    );

    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    // Save secret temporarily (not enabled yet)
    await supabase
      .from('profiles')
      .update({ mfa_secret: secret })
      .eq('user_id', user.id);

    return new Response(
      JSON.stringify({
        secret: secret,
        qrCode: qrCodeDataUrl,
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
