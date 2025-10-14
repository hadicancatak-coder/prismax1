-- Fix relationships between assignee tables and profiles
-- Drop existing foreign keys if they exist
ALTER TABLE IF EXISTS launch_campaign_assignees DROP CONSTRAINT IF EXISTS launch_campaign_assignees_user_id_fkey;
ALTER TABLE IF EXISTS task_assignees DROP CONSTRAINT IF EXISTS task_assignees_user_id_fkey;
ALTER TABLE IF EXISTS project_assignees DROP CONSTRAINT IF EXISTS project_assignees_user_id_fkey;
ALTER TABLE IF EXISTS campaign_assignees DROP CONSTRAINT IF EXISTS campaign_assignees_user_id_fkey;
ALTER TABLE IF EXISTS blocker_assignees DROP CONSTRAINT IF EXISTS blocker_assignees_user_id_fkey;

-- Add proper foreign keys to profiles.id (not user_id)
ALTER TABLE launch_campaign_assignees 
ADD CONSTRAINT launch_campaign_assignees_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE task_assignees 
ADD CONSTRAINT task_assignees_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE project_assignees 
ADD CONSTRAINT project_assignees_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE campaign_assignees 
ADD CONSTRAINT campaign_assignees_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE blocker_assignees 
ADD CONSTRAINT blocker_assignees_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update public_profiles view to include teams
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles AS
SELECT 
  user_id,
  name,
  username,
  avatar_url,
  title,
  tagline,
  teams
FROM profiles;

-- Recreate launch_campaigns_with_assignees view with correct join
DROP VIEW IF EXISTS launch_campaigns_with_assignees;
CREATE VIEW launch_campaigns_with_assignees AS
SELECT 
  lc.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', p.id,
        'user_id', p.user_id,
        'full_name', p.name,
        'avatar_url', p.avatar_url
      )
    ) FILTER (WHERE p.id IS NOT NULL),
    '[]'::json
  ) as assignees
FROM launch_pad_campaigns lc
LEFT JOIN launch_campaign_assignees lca ON lc.id = lca.campaign_id
LEFT JOIN profiles p ON lca.user_id = p.id
GROUP BY lc.id;