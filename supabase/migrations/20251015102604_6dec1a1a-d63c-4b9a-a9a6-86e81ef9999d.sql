
-- Fix assignment tables: Drop bad constraints, fix data, add correct constraints

-- Part 1: task_assignees table

-- Drop the incorrect foreign key constraint (if it exists)
ALTER TABLE task_assignees DROP CONSTRAINT IF EXISTS task_assignees_user_id_fkey;
ALTER TABLE task_assignees DROP CONSTRAINT IF EXISTS task_assignees_assigned_by_fkey;

-- Fix the data: Replace auth user IDs with profile IDs
UPDATE task_assignees
SET user_id = p.id
FROM profiles p
WHERE task_assignees.user_id = p.user_id
  AND task_assignees.user_id != p.id;

UPDATE task_assignees
SET assigned_by = p.id
FROM profiles p
WHERE task_assignees.assigned_by IS NOT NULL
  AND task_assignees.assigned_by = p.user_id
  AND task_assignees.assigned_by != p.id;

-- Add correct foreign key constraints pointing to profiles.id
ALTER TABLE task_assignees 
  ADD CONSTRAINT task_assignees_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE task_assignees 
  ADD CONSTRAINT task_assignees_assigned_by_fkey 
  FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Part 2: launch_campaign_assignees table

-- Drop the incorrect foreign key constraints
ALTER TABLE launch_campaign_assignees DROP CONSTRAINT IF EXISTS launch_campaign_assignees_user_id_fkey;
ALTER TABLE launch_campaign_assignees DROP CONSTRAINT IF EXISTS launch_campaign_assignees_assigned_by_fkey;

-- Fix the data
UPDATE launch_campaign_assignees
SET user_id = p.id
FROM profiles p
WHERE launch_campaign_assignees.user_id = p.user_id
  AND launch_campaign_assignees.user_id != p.id;

UPDATE launch_campaign_assignees
SET assigned_by = p.id
FROM profiles p
WHERE launch_campaign_assignees.assigned_by IS NOT NULL
  AND launch_campaign_assignees.assigned_by = p.user_id
  AND launch_campaign_assignees.assigned_by != p.id;

-- Add correct foreign key constraints
ALTER TABLE launch_campaign_assignees 
  ADD CONSTRAINT launch_campaign_assignees_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE launch_campaign_assignees 
  ADD CONSTRAINT launch_campaign_assignees_assigned_by_fkey 
  FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Part 3: blocker_assignees table

-- Drop the incorrect foreign key constraints
ALTER TABLE blocker_assignees DROP CONSTRAINT IF EXISTS blocker_assignees_user_id_fkey;
ALTER TABLE blocker_assignees DROP CONSTRAINT IF EXISTS blocker_assignees_assigned_by_fkey;

-- Fix the data
UPDATE blocker_assignees
SET user_id = p.id
FROM profiles p
WHERE blocker_assignees.user_id = p.user_id
  AND blocker_assignees.user_id != p.id;

UPDATE blocker_assignees
SET assigned_by = p.id
FROM profiles p
WHERE blocker_assignees.assigned_by IS NOT NULL
  AND blocker_assignees.assigned_by = p.user_id
  AND blocker_assignees.assigned_by != p.id;

-- Add correct foreign key constraints
ALTER TABLE blocker_assignees 
  ADD CONSTRAINT blocker_assignees_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE blocker_assignees 
  ADD CONSTRAINT blocker_assignees_assigned_by_fkey 
  FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Part 4: Add validation triggers to prevent future corruption

CREATE OR REPLACE FUNCTION validate_assignee_profile_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if NEW.user_id exists in profiles.id
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.user_id) THEN
    RAISE EXCEPTION 'Invalid user_id: must reference profiles.id, not profiles.user_id';
  END IF;
  
  -- Check if NEW.assigned_by exists in profiles.id (if not null)
  IF NEW.assigned_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.assigned_by) THEN
    RAISE EXCEPTION 'Invalid assigned_by: must reference profiles.id, not profiles.user_id';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply triggers
DROP TRIGGER IF EXISTS validate_task_assignee_ids ON task_assignees;
CREATE TRIGGER validate_task_assignee_ids
  BEFORE INSERT OR UPDATE ON task_assignees
  FOR EACH ROW
  EXECUTE FUNCTION validate_assignee_profile_id();

DROP TRIGGER IF EXISTS validate_campaign_assignee_ids ON launch_campaign_assignees;
CREATE TRIGGER validate_campaign_assignee_ids
  BEFORE INSERT OR UPDATE ON launch_campaign_assignees
  FOR EACH ROW
  EXECUTE FUNCTION validate_assignee_profile_id();

DROP TRIGGER IF EXISTS validate_blocker_assignee_ids ON blocker_assignees;
CREATE TRIGGER validate_blocker_assignee_ids
  BEFORE INSERT OR UPDATE ON blocker_assignees
  FOR EACH ROW
  EXECUTE FUNCTION validate_assignee_profile_id();
