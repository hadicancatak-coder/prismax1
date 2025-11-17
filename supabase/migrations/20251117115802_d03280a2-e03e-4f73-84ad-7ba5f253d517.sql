-- Check and fix RLS policies for ads table to allow updates
-- This fixes the "Failed to fetch" error when saving/updating ads

-- Drop existing restrictive UPDATE policy if it exists
DROP POLICY IF EXISTS "Users can update their own ads" ON ads;
DROP POLICY IF EXISTS "Users can update ads" ON ads;

-- Create a more permissive UPDATE policy for authenticated users
-- Allow any authenticated user to update ads (common in collaborative environments)
CREATE POLICY "Authenticated users can update ads" ON ads
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Also ensure SELECT policy allows reading ads
DROP POLICY IF EXISTS "Users can view ads" ON ads;
CREATE POLICY "Authenticated users can view ads" ON ads
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Ensure INSERT policy exists for creating ads
DROP POLICY IF EXISTS "Users can create ads" ON ads;
CREATE POLICY "Authenticated users can create ads" ON ads
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());