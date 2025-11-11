-- Function to extract client IP from forwarded-for chain
CREATE OR REPLACE FUNCTION extract_client_ip(ip_chain TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Extract first IP from comma-separated list
  RETURN TRIM(SPLIT_PART(ip_chain, ',', 1));
END;
$$;

-- Update all existing sessions to use only client IP
UPDATE mfa_sessions
SET ip_address = extract_client_ip(ip_address)
WHERE ip_address LIKE '%,%';

-- Add comment for future reference
COMMENT ON COLUMN mfa_sessions.ip_address IS 'Client IP address only (first IP from x-forwarded-for)';