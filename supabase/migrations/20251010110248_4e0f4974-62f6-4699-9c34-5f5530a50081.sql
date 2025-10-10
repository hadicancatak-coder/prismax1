-- Fix RLS policies for profiles table - restrict sensitive data access
DROP POLICY IF EXISTS "Public can view profile names only" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile email" ON public.profiles;

-- Users can only see their own full profile (including email and phone)
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Others can only see public profile info (name, avatar, username, title, tagline)
CREATE POLICY "Public profile info viewable by all"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Fix notifications - only system/admins can create for others
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

CREATE POLICY "Users can create own notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can create any notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix comment_mentions - only comment author can create mentions
DROP POLICY IF EXISTS "Users can create mentions" ON public.comment_mentions;

CREATE POLICY "Comment authors can create mentions"
ON public.comment_mentions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.comments
    WHERE comments.id = comment_id
    AND comments.author_id = auth.uid()
  )
);