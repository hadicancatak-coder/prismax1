-- Ensure profiles RLS policies exist
DROP POLICY IF EXISTS "user read own profile" ON profiles;
DROP POLICY IF EXISTS "user update own profile" ON profiles;

CREATE POLICY "user read own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "user update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure MFA flags exist and are set correctly
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS mfa_enrollment_required boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS mfa_enrolled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_temp_bypass_until timestamptz;

-- Set MFA required for all users
UPDATE profiles SET mfa_enrollment_required = true WHERE mfa_enrollment_required IS NULL;

-- Create backup codes table
CREATE TABLE IF NOT EXISTS mfa_backup_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mfa_backup_codes_user ON mfa_backup_codes(user_id);

-- Enable RLS on backup codes
ALTER TABLE mfa_backup_codes ENABLE ROW LEVEL SECURITY;

-- Policies for backup codes
DROP POLICY IF EXISTS "user read own codes meta" ON mfa_backup_codes;
DROP POLICY IF EXISTS "user manage own codes" ON mfa_backup_codes;

CREATE POLICY "user read own codes meta" 
ON mfa_backup_codes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "user manage own codes" 
ON mfa_backup_codes FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);