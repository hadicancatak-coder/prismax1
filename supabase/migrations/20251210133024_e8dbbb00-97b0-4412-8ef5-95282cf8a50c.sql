-- Function to notify task assignees when a new comment is added
CREATE OR REPLACE FUNCTION public.notify_task_assignees_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  assignee_record RECORD;
  assignee_user_id UUID;
  task_record RECORD;
  commenter_name TEXT;
  recent_count INTEGER;
BEGIN
  -- Get task details
  SELECT id, title INTO task_record
  FROM tasks
  WHERE id = NEW.task_id;
  
  -- Get commenter name
  SELECT name INTO commenter_name
  FROM profiles
  WHERE user_id = NEW.author_id;
  
  -- Notify all assignees except the comment author
  FOR assignee_record IN 
    SELECT ta.user_id
    FROM task_assignees ta
    WHERE ta.task_id = NEW.task_id
  LOOP
    -- Get auth.users.id from profiles.id
    SELECT user_id INTO assignee_user_id 
    FROM profiles 
    WHERE id = assignee_record.user_id;
    
    -- Skip if this is the comment author
    IF assignee_user_id IS NOT NULL AND assignee_user_id != NEW.author_id THEN
      -- Rate limiting check
      SELECT COUNT(*) INTO recent_count
      FROM notification_rate_limit
      WHERE user_id = assignee_user_id
        AND notification_type = 'task_new_comment'
        AND created_at > now() - interval '5 minutes';
      
      IF recent_count < 15 THEN
        -- Check if notification is enabled
        IF is_notification_enabled(assignee_user_id, 'task_new_comment') THEN
          INSERT INTO notifications (user_id, type, payload_json)
          VALUES (
            assignee_user_id,
            'task_new_comment',
            jsonb_build_object(
              'task_id', NEW.task_id,
              'task_title', task_record.title,
              'comment_id', NEW.id,
              'comment_preview', substring(NEW.body, 1, 100),
              'commenter_id', NEW.author_id,
              'commenter_name', commenter_name
            )
          );
          
          INSERT INTO notification_rate_limit (user_id, notification_type)
          VALUES (assignee_user_id, 'task_new_comment')
          ON CONFLICT DO NOTHING;
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for comment notifications
DROP TRIGGER IF EXISTS notify_on_task_comment ON comments;
CREATE TRIGGER notify_on_task_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assignees_on_comment();

-- Function to notify assignees on task field updates (deadline, priority)
CREATE OR REPLACE FUNCTION public.notify_task_field_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  assignee_record RECORD;
  assignee_user_id UUID;
  changer_id UUID;
  recent_count INTEGER;
BEGIN
  changer_id := auth.uid();
  
  -- Notify on deadline change
  IF NEW.due_at IS DISTINCT FROM OLD.due_at THEN
    FOR assignee_record IN 
      SELECT ta.user_id
      FROM task_assignees ta
      WHERE ta.task_id = NEW.id
    LOOP
      SELECT user_id INTO assignee_user_id 
      FROM profiles 
      WHERE id = assignee_record.user_id;
      
      IF assignee_user_id IS NOT NULL AND assignee_user_id != changer_id THEN
        SELECT COUNT(*) INTO recent_count
        FROM notification_rate_limit
        WHERE user_id = assignee_user_id
          AND notification_type = 'task_deadline_changed'
          AND created_at > now() - interval '5 minutes';
        
        IF recent_count < 10 THEN
          IF is_notification_enabled(assignee_user_id, 'task_deadline_changed') THEN
            INSERT INTO notifications (user_id, type, payload_json)
            VALUES (
              assignee_user_id,
              'task_deadline_changed',
              jsonb_build_object(
                'task_id', NEW.id,
                'task_title', NEW.title,
                'old_due_date', OLD.due_at,
                'new_due_date', NEW.due_at,
                'changed_by', changer_id
              )
            );
            
            INSERT INTO notification_rate_limit (user_id, notification_type)
            VALUES (assignee_user_id, 'task_deadline_changed')
            ON CONFLICT DO NOTHING;
          END IF;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  -- Notify on priority change
  IF NEW.priority IS DISTINCT FROM OLD.priority THEN
    FOR assignee_record IN 
      SELECT ta.user_id
      FROM task_assignees ta
      WHERE ta.task_id = NEW.id
    LOOP
      SELECT user_id INTO assignee_user_id 
      FROM profiles 
      WHERE id = assignee_record.user_id;
      
      IF assignee_user_id IS NOT NULL AND assignee_user_id != changer_id THEN
        SELECT COUNT(*) INTO recent_count
        FROM notification_rate_limit
        WHERE user_id = assignee_user_id
          AND notification_type = 'task_priority_changed'
          AND created_at > now() - interval '5 minutes';
        
        IF recent_count < 10 THEN
          IF is_notification_enabled(assignee_user_id, 'task_priority_changed') THEN
            INSERT INTO notifications (user_id, type, payload_json)
            VALUES (
              assignee_user_id,
              'task_priority_changed',
              jsonb_build_object(
                'task_id', NEW.id,
                'task_title', NEW.title,
                'old_priority', OLD.priority,
                'new_priority', NEW.priority,
                'changed_by', changer_id
              )
            );
            
            INSERT INTO notification_rate_limit (user_id, notification_type)
            VALUES (assignee_user_id, 'task_priority_changed')
            ON CONFLICT DO NOTHING;
          END IF;
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for task field update notifications
DROP TRIGGER IF EXISTS notify_on_task_field_updates ON tasks;
CREATE TRIGGER notify_on_task_field_updates
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_field_updates();