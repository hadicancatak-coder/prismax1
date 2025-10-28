-- Add task_id and auto_assigned columns to operation_audit_logs
ALTER TABLE operation_audit_logs
ADD COLUMN task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
ADD COLUMN auto_assigned BOOLEAN DEFAULT false;

-- Update RLS policies for admin access to audit logs
CREATE POLICY "Admins can update audit logs"
ON operation_audit_logs FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete audit logs"
ON operation_audit_logs FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Update RLS policies for admin access to audit items
CREATE POLICY "Admins can update audit items"
ON operation_audit_items FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete audit items"
ON operation_audit_items FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Populate platform_team_mapping with PPC and SocialUA platforms
INSERT INTO platform_team_mapping (platform, team_name, default_assignees) VALUES
-- PPC Team platforms
('Google', 'PPC', (SELECT array_agg(id) FROM profiles WHERE 'PPC' = ANY(teams))),
('Search', 'PPC', (SELECT array_agg(id) FROM profiles WHERE 'PPC' = ANY(teams))),
('DGen', 'PPC', (SELECT array_agg(id) FROM profiles WHERE 'PPC' = ANY(teams))),
('PMax', 'PPC', (SELECT array_agg(id) FROM profiles WHERE 'PPC' = ANY(teams))),
('Display', 'PPC', (SELECT array_agg(id) FROM profiles WHERE 'PPC' = ANY(teams))),
('GDN', 'PPC', (SELECT array_agg(id) FROM profiles WHERE 'PPC' = ANY(teams))),
('YouTube', 'PPC', (SELECT array_agg(id) FROM profiles WHERE 'PPC' = ANY(teams))),

-- SocialUA Team platforms
('Meta', 'SocialUA', (SELECT array_agg(id) FROM profiles WHERE 'SocialUA' = ANY(teams))),
('Facebook', 'SocialUA', (SELECT array_agg(id) FROM profiles WHERE 'SocialUA' = ANY(teams))),
('Instagram', 'SocialUA', (SELECT array_agg(id) FROM profiles WHERE 'SocialUA' = ANY(teams))),
('X', 'SocialUA', (SELECT array_agg(id) FROM profiles WHERE 'SocialUA' = ANY(teams))),
('TikTok', 'SocialUA', (SELECT array_agg(id) FROM profiles WHERE 'SocialUA' = ANY(teams))),
('Snap', 'SocialUA', (SELECT array_agg(id) FROM profiles WHERE 'SocialUA' = ANY(teams))),
('Reddit', 'SocialUA', (SELECT array_agg(id) FROM profiles WHERE 'SocialUA' = ANY(teams)))
ON CONFLICT (platform, team_name) DO UPDATE
SET default_assignees = EXCLUDED.default_assignees;

-- Create function to auto-create task from audit log
CREATE OR REPLACE FUNCTION auto_create_task_from_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  team_members UUID[];
  new_task_id UUID;
  assigner_profile_id UUID;
BEGIN
  -- Get the profile ID of the creator
  SELECT id INTO assigner_profile_id
  FROM profiles
  WHERE user_id = NEW.created_by
  LIMIT 1;

  -- Get default assignees for the platform
  SELECT default_assignees INTO team_members
  FROM platform_team_mapping
  WHERE platform = NEW.platform
  LIMIT 1;

  -- Create the task
  INSERT INTO tasks (
    title,
    description,
    created_by,
    due_at,
    task_type,
    priority,
    status
  ) VALUES (
    NEW.title,
    COALESCE(NEW.description, 'Operations Audit - Review and complete action items'),
    NEW.created_by,
    NEW.deadline,
    'operations',
    'High',
    'Pending'
  ) RETURNING id INTO new_task_id;

  -- Assign to team members if any found
  IF team_members IS NOT NULL AND array_length(team_members, 1) > 0 THEN
    INSERT INTO task_assignees (task_id, user_id, assigned_by)
    SELECT new_task_id, unnest(team_members), assigner_profile_id;
  END IF;

  -- Link task back to audit log
  UPDATE operation_audit_logs
  SET task_id = new_task_id, auto_assigned = true
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto task creation
CREATE TRIGGER auto_create_task_trigger
AFTER INSERT ON operation_audit_logs
FOR EACH ROW
EXECUTE FUNCTION auto_create_task_from_audit_log();