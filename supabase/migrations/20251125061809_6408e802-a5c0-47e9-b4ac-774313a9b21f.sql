-- Modify reschedule_overdue_tasks to only send notifications (not reschedule)
-- This preserves original due dates and only alerts users

CREATE OR REPLACE FUNCTION notify_overdue_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  task_record RECORD;
  assignee_record RECORD;
  assignee_user_id UUID;
BEGIN
  -- Find overdue tasks (exclude Backlog, Completed, Failed, and recurring)
  FOR task_record IN 
    SELECT t.id, t.title, t.due_at
    FROM tasks t
    WHERE t.due_at < CURRENT_DATE
      AND t.status NOT IN ('Completed', 'Failed', 'Backlog')
      AND COALESCE(t.is_recurring, false) = false
  LOOP
    -- Notify all assignees for this task
    FOR assignee_record IN 
      SELECT ta.user_id
      FROM task_assignees ta
      WHERE ta.task_id = task_record.id
    LOOP
      -- Get auth.users.id from profiles.id
      SELECT user_id INTO assignee_user_id 
      FROM profiles 
      WHERE id = assignee_record.user_id;
      
      IF assignee_user_id IS NOT NULL THEN
        -- Check if notification is enabled
        IF is_notification_enabled(assignee_user_id, 'task_overdue') THEN
          INSERT INTO notifications (user_id, type, payload_json)
          VALUES (
            assignee_user_id,
            'task_overdue',
            jsonb_build_object(
              'task_id', task_record.id,
              'task_title', task_record.title,
              'due_date', task_record.due_at
            )
          );
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;