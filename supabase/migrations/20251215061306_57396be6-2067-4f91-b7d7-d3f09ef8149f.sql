-- Make MFA mandatory for ALL existing and new users
UPDATE profiles 
SET mfa_enrollment_required = true 
WHERE mfa_enrollment_required = false OR mfa_enrollment_required IS NULL;

-- Ensure new users always require MFA
ALTER TABLE profiles 
ALTER COLUMN mfa_enrollment_required SET DEFAULT true;

-- Also set mfa_enrollment_required NOT NULL to prevent bypassing
ALTER TABLE profiles 
ALTER COLUMN mfa_enrollment_required SET NOT NULL;