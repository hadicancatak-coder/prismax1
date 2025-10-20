-- Add MFA backup code and bypass columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS mfa_backup_codes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS mfa_backup_codes_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS mfa_temp_bypass_until TIMESTAMPTZ;

-- Add constraint: backup codes must be array
ALTER TABLE profiles 
ADD CONSTRAINT profiles_backup_codes_check 
CHECK (jsonb_typeof(mfa_backup_codes) = 'array');

-- Create backup code usage tracking table
CREATE TABLE IF NOT EXISTS public.mfa_backup_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

ALTER TABLE public.mfa_backup_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own backup code usage"
ON public.mfa_backup_code_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert backup code usage"
ON public.mfa_backup_code_usage FOR INSERT
WITH CHECK (true);

-- Create MFA challenge tracking table for step-up authentication
CREATE TABLE IF NOT EXISTS public.mfa_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  action_context TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes')
);

ALTER TABLE public.mfa_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own MFA challenges"
ON public.mfa_challenges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert MFA challenges"
ON public.mfa_challenges FOR INSERT
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_mfa_challenges_expires_at ON public.mfa_challenges(expires_at);

-- Function to enforce MFA enrollment globally
CREATE OR REPLACE FUNCTION enforce_global_mfa()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.mfa_enrollment_required := true;
  RETURN NEW;
END;
$$;

-- Trigger on profile creation to enforce global MFA
DROP TRIGGER IF EXISTS trigger_enforce_global_mfa ON profiles;
CREATE TRIGGER trigger_enforce_global_mfa
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION enforce_global_mfa();

-- Update existing users to require MFA enrollment
UPDATE profiles 
SET mfa_enrollment_required = true
WHERE mfa_enrollment_required = false OR mfa_enrollment_required IS NULL;