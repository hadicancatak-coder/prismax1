-- Add backup codes and password tracking to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS mfa_backup_codes text[],
ADD COLUMN IF NOT EXISTS last_password_change timestamptz DEFAULT now();

-- Create function to regenerate backup codes
CREATE OR REPLACE FUNCTION regenerate_backup_codes()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  -- Update user's backup codes
  UPDATE profiles
  SET mfa_backup_codes = new_codes
  WHERE user_id = auth.uid();
  
  RETURN new_codes;
END;
$$;