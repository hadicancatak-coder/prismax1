-- Clean up unverified MFA factors for the user
DELETE FROM auth.mfa_factors 
WHERE user_id = '6496321c-9988-4e26-91d3-01e0243caa2c' 
AND status = 'unverified';

-- Reset MFA enrollment state in profiles so user can re-enroll properly
UPDATE profiles 
SET 
  mfa_enrolled = false,
  mfa_backup_codes = '[]'::jsonb,
  mfa_backup_codes_generated_at = NULL
WHERE user_id = '6496321c-9988-4e26-91d3-01e0243caa2c';
