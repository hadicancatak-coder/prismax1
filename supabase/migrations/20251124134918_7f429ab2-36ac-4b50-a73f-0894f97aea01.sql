-- Drop the restrictive delete policy
DROP POLICY IF EXISTS "Users can delete own ads" ON public.ads;

-- Allow all authenticated users to delete ads (or admins can delete all)
CREATE POLICY "Authenticated users can delete ads"
ON public.ads
FOR DELETE
TO authenticated
USING (auth.role() = 'authenticated');

-- Ensure admins can still manage all ads
-- (The existing "Admins can manage all ads" policy already covers this)