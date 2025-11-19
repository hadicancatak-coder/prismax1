-- Fix ad_groups RLS policy to allow inserts without strict created_by check
-- The issue is the WITH CHECK clause is too restrictive on INSERT

DROP POLICY IF EXISTS "Users can create ad groups" ON public.ad_groups;

CREATE POLICY "Users can create ad groups"
ON public.ad_groups
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ensure created_by defaults to current user
ALTER TABLE public.ad_groups 
ALTER COLUMN created_by SET DEFAULT auth.uid();