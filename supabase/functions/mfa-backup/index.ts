import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" }
  });
}

function generateBackupCodes(count = 8): string[] {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const generateSegment = (length: number) =>
    Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  
  return Array.from({ length: count }, () => `${generateSegment(4)}-${generateSegment(4)}`);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return json({ error: "unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User error:", userError);
      return json({ error: "no user" }, 401);
    }

    const { action, code } = await req.json();
    console.log("MFA Backup action:", action, "for user:", user.id);

    if (action === "generate") {
      // Delete existing backup codes
      await supabase.from("mfa_backup_codes").delete().eq("user_id", user.id);
      
      // Generate new codes
      const plainCodes = generateBackupCodes(8);
      
      // Hash and store
      const rows = await Promise.all(
        plainCodes.map(async (code) => ({
          user_id: user.id,
          code_hash: await bcrypt.hash(code)
        }))
      );

      const { error: insertError } = await supabase
        .from("mfa_backup_codes")
        .insert(rows);

      if (insertError) {
        console.error("Insert error:", insertError);
        return json({ error: insertError.message }, 500);
      }

      console.log("Generated", plainCodes.length, "backup codes");
      return json({ codes: plainCodes });
    }

    if (action === "verify") {
      if (!code) {
        return json({ error: "code required" }, 400);
      }

      // Get all unused backup codes for user
      const { data: codes, error: fetchError } = await supabase
        .from("mfa_backup_codes")
        .select("id, code_hash, used_at")
        .eq("user_id", user.id);

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        return json({ error: fetchError.message }, 500);
      }

      const activeCodes = (codes || []).filter(c => !c.used_at);
      console.log("Checking", activeCodes.length, "active backup codes");

      // Check if code matches any unused code
      let matchedId: string | null = null;
      for (const record of activeCodes) {
        const isMatch = await bcrypt.compare(code, record.code_hash);
        if (isMatch) {
          matchedId = record.id;
          break;
        }
      }

      if (!matchedId) {
        console.log("No matching backup code found");
        return json({ ok: false, reason: "invalid" });
      }

      // Mark code as used
      await supabase
        .from("mfa_backup_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", matchedId);

      console.log("Backup code verified and marked as used");
      return json({ ok: true });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e: any) {
    console.error("Server error:", e);
    return json({ error: e?.message || "server error" }, 500);
  }
});
