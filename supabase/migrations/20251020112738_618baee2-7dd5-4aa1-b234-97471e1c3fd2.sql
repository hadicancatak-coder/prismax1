-- Add MFA columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT[],
ADD COLUMN IF NOT EXISTS mfa_enrolled_at TIMESTAMPTZ;

-- Create MFA verification attempts table for rate limiting
CREATE TABLE IF NOT EXISTS public.mfa_verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  attempt_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  success BOOLEAN DEFAULT FALSE NOT NULL,
  ip_address TEXT
);

-- Enable RLS on mfa_verification_attempts
ALTER TABLE public.mfa_verification_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own MFA attempts
CREATE POLICY "Users can view own MFA attempts"
ON public.mfa_verification_attempts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: System can insert MFA attempts
CREATE POLICY "System can insert MFA attempts"
ON public.mfa_verification_attempts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for faster rate limiting queries
CREATE INDEX IF NOT EXISTS idx_mfa_attempts_user_time 
ON public.mfa_verification_attempts(user_id, attempt_time DESC);

-- Function to clean old MFA attempts (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_mfa_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.mfa_verification_attempts
  WHERE attempt_time < NOW() - INTERVAL '24 hours';
END;
$$;