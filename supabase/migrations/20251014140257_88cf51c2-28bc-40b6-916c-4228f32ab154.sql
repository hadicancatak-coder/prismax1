-- Fix 1: Add INSERT policy to profiles table
-- This allows new user registrations to create profile records via the handle_new_user trigger
CREATE POLICY "Allow profile creation on signup" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Fix 2: Drop and recreate views without SECURITY DEFINER
-- Replace launch_campaigns_with_assignees view
DROP VIEW IF EXISTS public.launch_campaigns_with_assignees;

CREATE VIEW public.launch_campaigns_with_assignees AS
SELECT 
  lpc.id,
  lpc.title,
  lpc.status,
  lpc.launch_month,
  lpc.launched_at,
  lpc.created_by,
  lpc.created_at,
  lpc.updated_at,
  lpc.updated_by,
  lpc.teams,
  lpc.lp_url,
  lpc.captions,
  lpc.creatives_link,
  COALESCE(
    json_agg(
      json_build_object(
        'user_id', lca.user_id,
        'assigned_at', lca.assigned_at
      )
    ) FILTER (WHERE lca.user_id IS NOT NULL),
    '[]'::json
  ) AS assignees
FROM public.launch_pad_campaigns lpc
LEFT JOIN public.launch_campaign_assignees lca ON lpc.id = lca.campaign_id
GROUP BY lpc.id, lpc.title, lpc.status, lpc.launch_month, lpc.launched_at, 
         lpc.created_by, lpc.created_at, lpc.updated_at, lpc.updated_by,
         lpc.teams, lpc.lp_url, lpc.captions, lpc.creatives_link;

-- Replace public_profiles view
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
SELECT 
  user_id,
  name,
  username,
  avatar_url,
  tagline,
  title,
  teams
FROM public.profiles;