-- Fix notify_task_status_change function - incorrect field reference
CREATE OR REPLACE FUNCTION public.notify_task_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
          'new_status', NEW.status,
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
$function$;

-- Create materialized view for task comment counts to optimize performance
CREATE MATERIALIZED VIEW IF NOT EXISTS task_comment_counts AS
SELECT 
  task_id,
  COUNT(*) as comment_count
FROM comments
GROUP BY task_id;

-- Create unique index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_comment_counts ON task_comment_counts(task_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_task_comment_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY task_comment_counts;
  RETURN NULL;
END;
$$;

-- Trigger to auto-refresh on comment changes
DROP TRIGGER IF EXISTS refresh_comment_counts_trigger ON comments;
CREATE TRIGGER refresh_comment_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_task_comment_counts();

-- Initial refresh of the view
REFRESH MATERIALIZED VIEW task_comment_counts;