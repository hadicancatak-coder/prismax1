-- 1. Fix RLS policies for profiles table
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Clean up the unverified factor for the current user
-- Note: This will be run, but the factor table is in auth schema which we can't directly modify
-- The cleanup will happen in the application code instead

-- 3. Reset mfa_enrolled flag for user who has unverified factor
UPDATE profiles 
SET mfa_enrolled = false 
WHERE user_id = '6496321c-9988-4e26-91d3-01e0243caa2c';