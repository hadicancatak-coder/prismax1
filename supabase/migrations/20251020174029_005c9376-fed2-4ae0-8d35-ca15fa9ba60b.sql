-- Fix Critical Security Issues: RLS Policies

-- ============================================================================
-- 1. FIX: ad_versions table - Add RLS policies
-- ============================================================================
ALTER TABLE ad_versions ENABLE ROW LEVEL SECURITY;

-- Users can view versions of their own ads
CREATE POLICY "Users can view own ad versions"
ON ad_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ads 
    WHERE ads.id = ad_versions.ad_id 
    AND ads.created_by = auth.uid()
  )
);

-- Admins can view all ad versions
CREATE POLICY "Admins can view all ad versions"
ON ad_versions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert versions (via triggers or application)
CREATE POLICY "System can create ad versions"
ON ad_versions FOR INSERT
WITH CHECK (true);

-- No UPDATE or DELETE policies = immutable audit trail


-- ============================================================================
-- 2. FIX: MFA Secrets Exposure - Move to separate secure table
-- ============================================================================

-- Create dedicated MFA secrets table with strict RLS
CREATE TABLE IF NOT EXISTS user_mfa_secrets (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_secret TEXT,
  mfa_backup_codes TEXT[],
  mfa_enrolled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS immediately
ALTER TABLE user_mfa_secrets ENABLE ROW LEVEL SECURITY;

-- Only users can access their own MFA secrets
CREATE POLICY "Users can only access own MFA secrets"
ON user_mfa_secrets FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Migrate existing MFA data from profiles to new table
INSERT INTO user_mfa_secrets (user_id, mfa_secret, mfa_backup_codes, mfa_enrolled_at, created_at)
SELECT 
  user_id,
  mfa_secret,
  CASE 
    WHEN mfa_backup_codes IS NOT NULL AND jsonb_typeof(mfa_backup_codes) = 'array' THEN
      ARRAY(SELECT jsonb_array_elements_text(mfa_backup_codes))
    ELSE 
      '{}'::TEXT[]
  END,
  mfa_enrolled_at,
  created_at
FROM profiles
WHERE mfa_secret IS NOT NULL OR mfa_backup_codes IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  mfa_secret = EXCLUDED.mfa_secret,
  mfa_backup_codes = EXCLUDED.mfa_backup_codes,
  mfa_enrolled_at = EXCLUDED.mfa_enrolled_at;

-- Remove MFA secrets from profiles table (keep mfa_enabled flag for quick checks)
ALTER TABLE profiles DROP COLUMN IF EXISTS mfa_secret;
ALTER TABLE profiles DROP COLUMN IF EXISTS mfa_backup_codes;
ALTER TABLE profiles DROP COLUMN IF EXISTS mfa_enrolled_at;

-- Update regenerate_backup_codes function to use new table
CREATE OR REPLACE FUNCTION regenerate_backup_codes()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_codes text[];
  code text;
BEGIN
  -- Generate 10 random 8-character codes
  FOR i IN 1..10 LOOP
    code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    new_codes := array_append(new_codes, code);
  END LOOP;
  
  -- Update user's backup codes in secure table
  INSERT INTO user_mfa_secrets (user_id, mfa_backup_codes, updated_at)
  VALUES (auth.uid(), new_codes, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    mfa_backup_codes = EXCLUDED.mfa_backup_codes,
    updated_at = now();
  
  RETURN new_codes;
END;
$$;


-- ============================================================================
-- 3. FIX: Backup tables without RLS - Drop them
-- ============================================================================

-- These are temporary migration artifacts and should be removed
DROP TABLE IF EXISTS profiles_backup_v5_upgrade;
DROP TABLE IF EXISTS user_roles_backup_v5_upgrade;