-- Fix notifications RLS policy to allow authenticated users to create notifications
-- This is needed for @mentions to work for all users, not just admins
DROP POLICY IF EXISTS "Only admins can create notifications" ON public.notifications;

CREATE POLICY "Authenticated users can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);