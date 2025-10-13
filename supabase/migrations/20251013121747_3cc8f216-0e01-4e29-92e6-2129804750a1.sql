-- Fix profile data exposure by dropping the overly permissive policy
DROP POLICY IF EXISTS "Public profiles viewable by authenticated users" ON public.profiles;

-- Remove duplicate policy
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;

-- Create admin-only RPC function to get all user profiles with email
CREATE OR REPLACE FUNCTION public.get_all_users_admin()
RETURNS TABLE (
  user_id uuid,
  name text,
  email text,
  username text,
  avatar_url text,
  working_days text,
  title text,
  phone_number text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT user_id, name, email, username, avatar_url, working_days, title, phone_number
  FROM profiles
  WHERE has_role(auth.uid(), 'admin'::app_role);
$$;