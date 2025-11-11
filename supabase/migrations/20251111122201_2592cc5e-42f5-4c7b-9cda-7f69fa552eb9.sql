-- Fix 1: Create MFA sessions table for server-side verification
CREATE TABLE IF NOT EXISTS public.mfa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '6 hours'),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on mfa_sessions
ALTER TABLE public.mfa_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own MFA sessions
CREATE POLICY "Users can view own MFA sessions"
  ON public.mfa_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- System can insert MFA sessions
CREATE POLICY "System can create MFA sessions"
  ON public.mfa_sessions
  FOR INSERT
  WITH CHECK (true);

-- Auto-cleanup expired sessions
CREATE INDEX idx_mfa_sessions_expires_at ON public.mfa_sessions(expires_at);
CREATE INDEX idx_mfa_sessions_user_id ON public.mfa_sessions(user_id);
CREATE INDEX idx_mfa_sessions_token ON public.mfa_sessions(session_token);

-- Function to validate MFA session
CREATE OR REPLACE FUNCTION public.validate_mfa_session(session_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_valid BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.mfa_sessions
    WHERE mfa_sessions.session_token = validate_mfa_session.session_token
      AND mfa_sessions.user_id = auth.uid()
      AND mfa_sessions.expires_at > now()
  ) INTO is_valid;
  
  RETURN is_valid;
END;
$$;

-- Function to cleanup old MFA sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_mfa_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.mfa_sessions
  WHERE expires_at < now();
END;
$$;

-- Fix 2: Add SET search_path to existing SECURITY DEFINER functions
-- Update regenerate_backup_codes
CREATE OR REPLACE FUNCTION public.regenerate_backup_codes()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_codes text[];
  code text;
BEGIN
  -- Generate 10 new backup codes
  FOR i IN 1..10 LOOP
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    new_codes := array_append(new_codes, code);
  END LOOP;

  -- Update user's backup codes
  UPDATE public.user_mfa_secrets
  SET mfa_backup_codes = new_codes,
      updated_at = now()
  WHERE user_id = auth.uid();

  RETURN new_codes;
END;
$$;

-- Update send_notification function
CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_link text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_metadata)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Update is_notification_enabled function
CREATE OR REPLACE FUNCTION public.is_notification_enabled(
  p_user_id uuid,
  p_notification_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_enabled boolean;
BEGIN
  SELECT COALESCE(
    (preferences->p_notification_type->'enabled')::boolean,
    true
  ) INTO is_enabled
  FROM public.notification_preferences
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(is_enabled, true);
END;
$$;

-- Update cleanup_old_mfa_attempts function
CREATE OR REPLACE FUNCTION public.cleanup_old_mfa_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.mfa_verification_attempts
  WHERE attempt_time < (now() - INTERVAL '30 days');
END;
$$;

-- Update cleanup_rate_limit function  
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.mfa_verification_attempts
  WHERE attempt_time < (now() - INTERVAL '1 hour');
END;
$$;