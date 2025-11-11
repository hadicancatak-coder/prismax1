-- Fix the extract_client_ip function to have search_path set
CREATE OR REPLACE FUNCTION extract_client_ip(ip_chain TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Extract first IP from comma-separated list
  RETURN TRIM(SPLIT_PART(ip_chain, ',', 1));
END;
$$;