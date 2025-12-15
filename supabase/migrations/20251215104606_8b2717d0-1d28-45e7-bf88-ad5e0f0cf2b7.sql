-- Fix notify_task_new_comment trigger function - use 'name' instead of 'full_name'
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
BEGIN
  -- Get task details
  SELECT id, title INTO task_record FROM tasks WHERE id = NEW.task_id;
  
  -- Get commenter name (FIXED: use 'name' instead of 'full_name')
  SELECT name INTO commenter_name FROM profiles WHERE user_id = NEW.author_id;
  
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
$$;

-- Fix notify_comment_mention trigger function - use 'name' instead of 'full_name'
CREATE OR REPLACE FUNCTION public.notify_comment_mention()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  task_record RECORD;
  mentioner_name TEXT;
BEGIN
  -- Get task details
  SELECT t.id, t.title INTO task_record 
  FROM comments c
  JOIN tasks t ON t.id = c.task_id
  WHERE c.id = NEW.comment_id;
  
  -- Get mentioner name (FIXED: use 'name' instead of 'full_name')
  SELECT p.name INTO mentioner_name 
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
$$;