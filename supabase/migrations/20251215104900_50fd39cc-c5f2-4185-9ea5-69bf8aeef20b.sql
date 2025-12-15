-- Fix notify_task_new_comment to use auth user ids for notifications (task_assignees.user_id is profiles.id)
-- and ensure notification failures never block comment insertion.
CREATE OR REPLACE FUNCTION public.notify_task_new_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  assignee RECORD;
  task_record RECORD;
  commenter_name TEXT;
  assignee_auth_user_id UUID;
BEGIN
  -- Get task details
  SELECT id, title INTO task_record
  FROM tasks
  WHERE id = NEW.task_id;

  -- Get commenter name
  SELECT name INTO commenter_name
  FROM profiles
  WHERE user_id = NEW.author_id;

  -- Notify all assignees except the commenter
  FOR assignee IN
    SELECT user_id
    FROM task_assignees
    WHERE task_id = NEW.task_id
  LOOP
    -- task_assignees.user_id is profiles.id; convert to auth.users.id
    SELECT user_id INTO assignee_auth_user_id
    FROM profiles
    WHERE id = assignee.user_id;

    -- Skip if can't resolve or it's the comment author
    IF assignee_auth_user_id IS NULL OR assignee_auth_user_id = NEW.author_id THEN
      CONTINUE;
    END IF;

    BEGIN
      PERFORM send_notification(
        assignee_auth_user_id,
        'task_new_comment',
        jsonb_build_object(
          'task_id', NEW.task_id,
          'task_title', task_record.title,
          'comment_id', NEW.id,
          'commenter_id', NEW.author_id,
          'commenter_name', commenter_name,
          'comment_preview', LEFT(NEW.body, 100)
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Never block comment creation
      RAISE WARNING 'notify_task_new_comment failed: %', SQLERRM;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;