-- Fix RLS policies to consistently require authentication for viewing

-- Drop and recreate ads view policy with authenticated role
DROP POLICY IF EXISTS "Ads viewable by authenticated users" ON public.ads;
CREATE POLICY "Ads viewable by authenticated users"
ON public.ads
FOR SELECT
TO authenticated
USING (true);

-- Ensure consistent role requirements across all policies
-- Update other ads policies to use authenticated role
DROP POLICY IF EXISTS "Admins can manage all ads" ON public.ads;
CREATE POLICY "Admins can manage all ads"
ON public.ads
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can create own ads" ON public.ads;
CREATE POLICY "Users can create own ads"
ON public.ads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update own ads" ON public.ads;
CREATE POLICY "Users can update own ads"
ON public.ads
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete own ads" ON public.ads;
CREATE POLICY "Users can delete own ads"
ON public.ads
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);