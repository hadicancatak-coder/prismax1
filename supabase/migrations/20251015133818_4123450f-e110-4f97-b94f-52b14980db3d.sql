-- Fix track_assignment_changes to use auth.users.id instead of profiles.id
CREATE OR REPLACE FUNCTION public.track_assignment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entity_type text;
  entity_id uuid;
  assigner_auth_id uuid;
  unassigner_auth_id uuid;
BEGIN
  -- Determine entity type and ID
  IF TG_TABLE_NAME = 'task_assignees' THEN
    entity_type := 'task';
    entity_id := COALESCE(NEW.task_id, OLD.task_id);
  ELSIF TG_TABLE_NAME = 'project_assignees' THEN
    entity_type := 'project';
    entity_id := COALESCE(NEW.project_id, OLD.project_id);
  ELSIF TG_TABLE_NAME = 'campaign_assignees' THEN
    entity_type := 'campaign';
    entity_id := COALESCE(NEW.campaign_id, OLD.campaign_id);
  ELSIF TG_TABLE_NAME = 'blocker_assignees' THEN
    entity_type := 'blocker';
    entity_id := COALESCE(NEW.blocker_id, OLD.blocker_id);
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    -- Get auth.users.id from profiles.id
    SELECT user_id INTO assigner_auth_id
    FROM profiles
    WHERE id = NEW.assigned_by;
    
    -- Only log if we found the auth user ID
    IF assigner_auth_id IS NOT NULL THEN
      PERFORM log_activity(
        assigner_auth_id,
        'assigned',
        entity_type,
        entity_id,
        'assignee',
        NULL,
        NEW.user_id::text,
        jsonb_build_object('assigned_user_id', NEW.user_id)
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- For DELETE, try to get current auth user
    unassigner_auth_id := auth.uid();
    
    -- Only log if we have a valid user
    IF unassigner_auth_id IS NOT NULL THEN
      PERFORM log_activity(
        unassigner_auth_id,
        'unassigned',
        entity_type,
        entity_id,
        'assignee',
        OLD.user_id::text,
        NULL,
        jsonb_build_object('unassigned_user_id', OLD.user_id)
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;