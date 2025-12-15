-- Safe task status change notification function
-- CRITICAL: Only inserts to notifications table, no FK to auth.users
CREATE OR REPLACE FUNCTION public.notify_on_task_status_change()
RETURNS TRIGGER AS $$
DECLARE
  assignee_record RECORD;
BEGIN
  -- Only notify if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get all assignees except the person who made the change
    FOR assignee_record IN 
      SELECT ta.user_id
      FROM task_assignees ta
      JOIN profiles p ON p.id = ta.user_id
      WHERE ta.task_id = NEW.id
        AND p.user_id IS DISTINCT FROM auth.uid()
    LOOP
      -- Check if notification is enabled for this user
      IF is_notification_enabled(assignee_record.user_id, 'task_status_changed') THEN
        BEGIN
          INSERT INTO notifications (user_id, type, payload_json)
          VALUES (
            assignee_record.user_id,
            'task_status_changed',
            jsonb_build_object(
              'task_id', NEW.id,
              'task_title', NEW.title,
              'old_status', OLD.status,
              'new_status', NEW.status,
              'changed_by', auth.uid()
            )
          );
        EXCEPTION WHEN OTHERS THEN
          -- Log but don't fail the task operation
          RAISE WARNING 'Notification insert failed: %', SQLERRM;
        END;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Safe task assignment notification function
CREATE OR REPLACE FUNCTION public.notify_on_task_assignment()
RETURNS TRIGGER AS $$
DECLARE
  task_title TEXT;
  assignee_auth_id UUID;
BEGIN
  -- Get task title
  SELECT title INTO task_title FROM tasks WHERE id = NEW.task_id;
  
  -- Get the auth user_id from profiles
  SELECT user_id INTO assignee_auth_id FROM profiles WHERE id = NEW.user_id;
  
  -- Only notify if we found the user and they're not the assigner
  IF assignee_auth_id IS NOT NULL AND assignee_auth_id IS DISTINCT FROM auth.uid() THEN
    -- Check if notification is enabled
    IF is_notification_enabled(assignee_auth_id, 'task_assigned') THEN
      BEGIN
        INSERT INTO notifications (user_id, type, payload_json)
        VALUES (
          assignee_auth_id,
          'task_assigned',
          jsonb_build_object(
            'task_id', NEW.task_id,
            'task_title', task_title,
            'assigned_by', auth.uid()
          )
        );
      EXCEPTION WHEN OTHERS THEN
        -- Log but don't fail the assignment operation
        RAISE WARNING 'Assignment notification failed: %', SQLERRM;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing triggers if they exist (safely)
DROP TRIGGER IF EXISTS notify_task_status_change_trigger ON tasks;
DROP TRIGGER IF EXISTS notify_task_assignment_trigger ON task_assignees;

-- Create new safe triggers
CREATE TRIGGER notify_task_status_change_trigger
  AFTER UPDATE OF status ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_task_status_change();

CREATE TRIGGER notify_task_assignment_trigger
  AFTER INSERT ON task_assignees
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_task_assignment();