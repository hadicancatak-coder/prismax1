-- Enable realtime for tables not already enabled
DO $$
BEGIN
  -- Only add if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'activity_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'blockers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE blockers;
  END IF;
END $$;

-- Add notification trigger for task status changes
CREATE OR REPLACE FUNCTION notify_task_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT COUNT(*) INTO recent_count
    FROM notification_rate_limit
    WHERE user_id = NEW.assignee_id
      AND notification_type = 'task_status_changed'
      AND created_at > now() - interval '5 minutes';
    
    IF recent_count < 10 AND NEW.assignee_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, payload_json)
      VALUES (
        NEW.assignee_id,
        'task_status_changed',
        jsonb_build_object(
          'task_id', NEW.id,
          'task_title', NEW.title,
          'old_status', OLD.status,
          'new_status', NEW.new_status,
          'changed_by', auth.uid()
        )
      );
      
      INSERT INTO notification_rate_limit (user_id, notification_type)
      VALUES (NEW.assignee_id, 'task_status_changed')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS task_status_change_notification ON tasks;
CREATE TRIGGER task_status_change_notification
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION notify_task_status_change();

-- Add notification trigger for blockers
CREATE OR REPLACE FUNCTION notify_blocker_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_assignee_id uuid;
  recent_count integer;
BEGIN
  SELECT assignee_id INTO task_assignee_id
  FROM tasks
  WHERE id = NEW.task_id;
  
  IF task_assignee_id IS NOT NULL THEN
    SELECT COUNT(*) INTO recent_count
    FROM notification_rate_limit
    WHERE user_id = task_assignee_id
      AND notification_type = 'blocker_created'
      AND created_at > now() - interval '5 minutes';
    
    IF recent_count < 10 THEN
      INSERT INTO notifications (user_id, type, payload_json)
      VALUES (
        task_assignee_id,
        'blocker_created',
        jsonb_build_object(
          'blocker_id', NEW.id,
          'task_id', NEW.task_id,
          'blocker_title', NEW.title,
          'created_by', NEW.created_by
        )
      );
      
      INSERT INTO notification_rate_limit (user_id, notification_type)
      VALUES (task_assignee_id, 'blocker_created')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS blocker_created_notification ON blockers;
CREATE TRIGGER blocker_created_notification
AFTER INSERT ON blockers
FOR EACH ROW
EXECUTE FUNCTION notify_blocker_created();

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON tasks(due_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);

-- Clean up old rate limit entries
CREATE OR REPLACE FUNCTION cleanup_rate_limit()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM notification_rate_limit
  WHERE created_at < now() - interval '1 hour';
END;
$$;