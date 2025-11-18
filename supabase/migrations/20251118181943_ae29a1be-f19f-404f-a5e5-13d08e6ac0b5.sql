-- Fix auto_create_task_from_audit_log to use valid task_type
CREATE OR REPLACE FUNCTION public.auto_create_task_from_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Create the task with valid task_type
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
    'generic',  -- Changed from 'operations' to 'generic'
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
$function$;