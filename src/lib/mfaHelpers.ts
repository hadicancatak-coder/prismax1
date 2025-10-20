import { supabase } from "@/integrations/supabase/client";

/**
 * Check if user has a recent valid MFA challenge for the given action
 * @param actionContext - The action context (e.g., 'role_change', 'user_delete', 'approval')
 * @returns true if a valid challenge exists within 5 minutes
 */
export const checkRecentMFAChallenge = async (actionContext: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { data, error } = await supabase
    .from("mfa_challenges")
    .select("*")
    .eq("user_id", user.id)
    .eq("action_context", actionContext)
    .gte("expires_at", new Date().toISOString())
    .order("verified_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  
  return !error && data !== null;
};

/**
 * Create a new MFA challenge record after successful verification
 * @param actionContext - The action context (e.g., 'role_change', 'user_delete', 'approval')
 */
export const createMFAChallenge = async (actionContext: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  await supabase.from("mfa_challenges").insert({
    user_id: user.id,
    challenge_type: "step_up",
    action_context: actionContext,
    verified_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
  });
};

/**
 * Generate random 8-digit backup code
 */
export const generateBackupCode = (): string => {
  const code = Math.floor(10000000 + Math.random() * 90000000);
  return code.toString();
};

/**
 * Hash backup code using SHA-256 (client-side hashing for storage)
 */
export const hashBackupCode = async (code: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Verify backup code against stored hashes
 */
export const verifyBackupCode = async (code: string, storedHashes: string[]): Promise<number> => {
  const inputHash = await hashBackupCode(code);
  return storedHashes.findIndex(hash => hash === inputHash);
};
