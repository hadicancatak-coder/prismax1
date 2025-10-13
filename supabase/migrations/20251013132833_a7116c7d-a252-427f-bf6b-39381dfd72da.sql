-- Allow all authenticated users to view basic public profile info
CREATE POLICY "Public profile data viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);