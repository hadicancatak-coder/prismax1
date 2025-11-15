-- Ensure all users have MFA enrollment required flag set to true
UPDATE profiles 
SET mfa_enrollment_required = true 
WHERE mfa_enrollment_required = false OR mfa_enrollment_required IS NULL;