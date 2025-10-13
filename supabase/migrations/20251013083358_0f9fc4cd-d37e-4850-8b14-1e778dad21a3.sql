-- Create security definer function for comment mentions
CREATE OR REPLACE FUNCTION public.is_comment_author(_comment_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM comments
    WHERE id = _comment_id AND author_id = _user_id
  )
$$;

-- Update comment_mentions RLS policy to use the security definer function
DROP POLICY IF EXISTS "Comment authors can create mentions" ON comment_mentions;

CREATE POLICY "Comment authors can create mentions"
ON comment_mentions FOR INSERT
WITH CHECK (is_comment_author(comment_id, auth.uid()));

-- Restrict campaigns to authenticated users only
DROP POLICY IF EXISTS "Campaigns viewable by authenticated users" ON campaigns;

CREATE POLICY "Campaigns viewable by authenticated users"
ON public.campaigns FOR SELECT
TO authenticated
USING (true);