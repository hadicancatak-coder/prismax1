-- Change default session expiry from 6 hours to 24 hours
ALTER TABLE public.mfa_sessions 
ALTER COLUMN expires_at SET DEFAULT (now() + INTERVAL '24 hours');

-- Update all existing active sessions to have 24-hour expiry and skip IP validation
UPDATE public.mfa_sessions 
SET expires_at = now() + INTERVAL '24 hours',
    skip_validation_for_ip = true
WHERE expires_at > now();