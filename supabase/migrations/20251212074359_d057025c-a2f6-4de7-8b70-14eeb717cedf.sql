-- Create trigger function for task assignment notifications
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification to the newly assigned user
  PERFORM send_notification(
    NEW.user_id,
    'task_assigned',
    jsonb_build_object(
      'task_id', NEW.task_id,
      'task_title', (SELECT title FROM tasks WHERE id = NEW.task_id),
      'assigned_by', NEW.assigned_by
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for task assignments
DROP TRIGGER IF EXISTS trigger_notify_task_assigned ON task_assignees;
CREATE TRIGGER trigger_notify_task_assigned
  AFTER INSERT ON task_assignees
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();


-- Create trigger function for task status changes
CREATE OR REPLACE FUNCTION notify_task_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  assignee RECORD;
BEGIN
  -- Only notify if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify all assignees
    FOR assignee IN 
      SELECT user_id FROM task_assignees WHERE task_id = NEW.id
    LOOP
      PERFORM send_notification(
        assignee.user_id,
        'task_status_changed',
        jsonb_build_object(
          'task_id', NEW.id,
          'task_title', NEW.title,
          'old_status', OLD.status,
          'new_status', NEW.status
        )
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for task status changes
DROP TRIGGER IF EXISTS trigger_notify_task_status ON tasks;
CREATE TRIGGER trigger_notify_task_status
  AFTER UPDATE ON tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_task_status_changed();


-- Create trigger function for task deadline changes
CREATE OR REPLACE FUNCTION notify_task_deadline_changed()
RETURNS TRIGGER AS $$
DECLARE
  assignee RECORD;
BEGIN
  -- Only notify if deadline actually changed
  IF OLD.due_at IS DISTINCT FROM NEW.due_at THEN
    FOR assignee IN 
      SELECT user_id FROM task_assignees WHERE task_id = NEW.id
    LOOP
      PERFORM send_notification(
        assignee.user_id,
        'task_deadline_changed',
        jsonb_build_object(
          'task_id', NEW.id,
          'task_title', NEW.title,
          'old_due_date', OLD.due_at,
          'new_due_date', NEW.due_at
        )
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for deadline changes
DROP TRIGGER IF EXISTS trigger_notify_task_deadline ON tasks;
CREATE TRIGGER trigger_notify_task_deadline
  AFTER UPDATE ON tasks
  FOR EACH ROW
  WHEN (OLD.due_at IS DISTINCT FROM NEW.due_at)
  EXECUTE FUNCTION notify_task_deadline_changed();


-- Create trigger function for task priority changes
CREATE OR REPLACE FUNCTION notify_task_priority_changed()
RETURNS TRIGGER AS $$
DECLARE
  assignee RECORD;
BEGIN
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    FOR assignee IN 
      SELECT user_id FROM task_assignees WHERE task_id = NEW.id
    LOOP
      PERFORM send_notification(
        assignee.user_id,
        'task_priority_changed',
        jsonb_build_object(
          'task_id', NEW.id,
          'task_title', NEW.title,
          'old_priority', OLD.priority,
          'new_priority', NEW.priority
        )
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for priority changes
DROP TRIGGER IF EXISTS trigger_notify_task_priority ON tasks;
CREATE TRIGGER trigger_notify_task_priority
  AFTER UPDATE ON tasks
  FOR EACH ROW
  WHEN (OLD.priority IS DISTINCT FROM NEW.priority)
  EXECUTE FUNCTION notify_task_priority_changed();


-- Create trigger function for new comments
CREATE OR REPLACE FUNCTION notify_task_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  assignee RECORD;
  task_record RECORD;
  commenter_name TEXT;
BEGIN
  -- Get task details
  SELECT id, title INTO task_record FROM tasks WHERE id = NEW.task_id;
  
  -- Get commenter name
  SELECT full_name INTO commenter_name FROM profiles WHERE user_id = NEW.author_id;
  
  -- Notify all assignees except the commenter
  FOR assignee IN 
    SELECT user_id FROM task_assignees 
    WHERE task_id = NEW.task_id AND user_id != NEW.author_id
  LOOP
    PERFORM send_notification(
      assignee.user_id,
      'task_new_comment',
      jsonb_build_object(
        'task_id', task_record.id,
        'task_title', task_record.title,
        'comment_id', NEW.id,
        'commenter_id', NEW.author_id,
        'commenter_name', commenter_name,
        'comment_preview', LEFT(NEW.body, 100)
      )
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new comments
DROP TRIGGER IF EXISTS trigger_notify_task_comment ON comments;
CREATE TRIGGER trigger_notify_task_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_new_comment();


-- Create trigger function for blocker resolved
CREATE OR REPLACE FUNCTION notify_blocker_resolved()
RETURNS TRIGGER AS $$
DECLARE
  assignee RECORD;
  task_record RECORD;
BEGIN
  -- Only notify when blocker is newly resolved
  IF NEW.resolved = true AND (OLD.resolved IS NULL OR OLD.resolved = false) THEN
    SELECT id, title INTO task_record FROM tasks WHERE id = NEW.task_id;
    
    FOR assignee IN 
      SELECT user_id FROM task_assignees WHERE task_id = NEW.task_id
    LOOP
      PERFORM send_notification(
        assignee.user_id,
        'blocker_resolved',
        jsonb_build_object(
          'task_id', task_record.id,
          'task_title', task_record.title,
          'blocker_id', NEW.id,
          'blocker_title', NEW.title
        )
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for blocker resolution
DROP TRIGGER IF EXISTS trigger_notify_blocker_resolved ON blockers;
CREATE TRIGGER trigger_notify_blocker_resolved
  AFTER UPDATE ON blockers
  FOR EACH ROW
  WHEN (NEW.resolved = true AND (OLD.resolved IS NULL OR OLD.resolved = false))
  EXECUTE FUNCTION notify_blocker_resolved();


-- Create trigger function for @mentions in comments
CREATE OR REPLACE FUNCTION notify_comment_mention()
RETURNS TRIGGER AS $$
DECLARE
  task_record RECORD;
  mentioner_name TEXT;
BEGIN
  -- Get task details
  SELECT t.id, t.title INTO task_record 
  FROM comments c
  JOIN tasks t ON t.id = c.task_id
  WHERE c.id = NEW.comment_id;
  
  -- Get mentioner name
  SELECT p.full_name INTO mentioner_name 
  FROM comments c
  JOIN profiles p ON p.user_id = c.author_id
  WHERE c.id = NEW.comment_id;
  
  PERFORM send_notification(
    NEW.mentioned_user_id,
    'comment_mention',
    jsonb_build_object(
      'task_id', task_record.id,
      'task_title', task_record.title,
      'comment_id', NEW.comment_id,
      'mentioner_name', mentioner_name
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for mentions
DROP TRIGGER IF EXISTS trigger_notify_comment_mention ON comment_mentions;
CREATE TRIGGER trigger_notify_comment_mention
  AFTER INSERT ON comment_mentions
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_mention();