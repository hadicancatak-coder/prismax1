-- IMMEDIATE FIX: Make MFA optional for all users
-- This gives everyone access while we rebuild the system properly

UPDATE profiles 
SET mfa_enrollment_required = false
WHERE mfa_enrollment_required = true;

-- Add a comment for clarity
COMMENT ON COLUMN profiles.mfa_enrollment_required IS 'MFA is now optional - users can enable it from their profile';