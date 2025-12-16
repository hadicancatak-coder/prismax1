-- Drop orphaned tables from deleted features
-- These tables have no code references and contain minimal/no data

-- First drop tables with foreign key dependencies
DROP TABLE IF EXISTS compliance_reviews CASCADE;
DROP TABLE IF EXISTS compliance_assets CASCADE;
DROP TABLE IF EXISTS compliance_requests CASCADE;

DROP TABLE IF EXISTS operation_audit_item_comments CASCADE;
DROP TABLE IF EXISTS operation_audit_items CASCADE;
DROP TABLE IF EXISTS operation_audit_logs CASCADE;

DROP TABLE IF EXISTS status_logs CASCADE;

-- Now fix notification system: notify task CREATOR when assignees complete tasks or add comments

-- Function to notify task creator when task is completed by an assignee
CREATE OR REPLACE FUNCTION public.notify_task_creator_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  task_creator_id UUID;
  changer_id UUID;
BEGIN
  -- Only trigger when status changes to Completed
  IF NEW.status = 'Completed' AND OLD.status IS DISTINCT FROM 'Completed' THEN
    changer_id := auth.uid();
    task_creator_id := NEW.created_by;
    
    -- Only notify if creator is different from the person completing
    IF task_creator_id IS NOT NULL AND task_creator_id != changer_id THEN
      -- Check if notification is enabled for this user
      IF is_notification_enabled(task_creator_id, 'task_completed') THEN
        BEGIN
          INSERT INTO notifications (user_id, type, payload_json)
          VALUES (
            task_creator_id,
            'task_completed',
            jsonb_build_object(
              'task_id', NEW.id,
              'task_title', NEW.title,
              'completed_by', changer_id
            )
          );
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Notification insert failed: %', SQLERRM;
        END;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to notify task creator when someone comments on their task
CREATE OR REPLACE FUNCTION public.notify_task_creator_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  task_creator_id UUID;
  task_title TEXT;
  commenter_name TEXT;
BEGIN
  -- Get task details
  SELECT created_by, title INTO task_creator_id, task_title
  FROM tasks
  WHERE id = NEW.task_id;
  
  -- Get commenter name
  SELECT name INTO commenter_name
  FROM profiles
  WHERE user_id = NEW.author_id;
  
  -- Only notify if creator is different from commenter
  IF task_creator_id IS NOT NULL AND task_creator_id != NEW.author_id THEN
    -- Check if notification is enabled
    IF is_notification_enabled(task_creator_id, 'task_new_comment') THEN
      BEGIN
        INSERT INTO notifications (user_id, type, payload_json)
        VALUES (
          task_creator_id,
          'task_new_comment',
          jsonb_build_object(
            'task_id', NEW.task_id,
            'task_title', task_title,
            'comment_id', NEW.id,
            'comment_preview', substring(NEW.body, 1, 100),
            'commenter_id', NEW.author_id,
            'commenter_name', commenter_name
          )
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Notification insert failed: %', SQLERRM;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for task completion notification to creator
DROP TRIGGER IF EXISTS notify_task_creator_completion ON tasks;
CREATE TRIGGER notify_task_creator_completion
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_creator_on_completion();

-- Create trigger for comment notification to task creator
DROP TRIGGER IF EXISTS notify_task_creator_comment ON comments;
CREATE TRIGGER notify_task_creator_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_creator_on_comment();