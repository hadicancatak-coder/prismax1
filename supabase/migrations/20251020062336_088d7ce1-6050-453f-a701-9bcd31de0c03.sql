-- =====================================================
-- LOVABLE V5 SECURITY UPGRADE - PHASE 1: DATABASE SETUP
-- =====================================================

-- 1. CREATE BACKUP TABLES
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles_backup_v5_upgrade AS 
SELECT *, now() as backup_timestamp FROM profiles;

CREATE TABLE IF NOT EXISTS user_roles_backup_v5_upgrade AS 
SELECT *, now() as backup_timestamp FROM user_roles;

-- 2. CREATE AUTH EVENTS AUDIT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS auth_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_events_user_id ON auth_events(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON auth_events(created_at DESC);
ALTER TABLE auth_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auth_events
CREATE POLICY "Admins can view all auth events"
ON auth_events FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own auth events"
ON auth_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert auth events"
ON auth_events FOR INSERT
WITH CHECK (true);

-- 3. ADD SECURITY COLUMNS TO PROFILES
-- =====================================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS force_password_reset BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mfa_enrolled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mfa_enrollment_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS password_last_changed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_mfa_prompt_at TIMESTAMPTZ;

-- Mark all existing users for mandatory password reset
UPDATE profiles 
SET force_password_reset = true,
    mfa_enrollment_required = (
      SELECT role = 'admin' 
      FROM user_roles 
      WHERE user_roles.user_id = profiles.user_id
    )
WHERE user_id IN (SELECT id FROM auth.users);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_force_password_reset 
ON profiles(force_password_reset) WHERE force_password_reset = true;

-- 4. CREATE PASSWORD RESET TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(token_hash)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reset tokens"
ON password_reset_tokens FOR SELECT
USING (auth.uid() = user_id);