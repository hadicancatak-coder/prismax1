-- Add working_days column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS working_days TEXT DEFAULT 'mon-fri';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_working_days ON public.profiles(working_days);

-- Create function to send notification when user is assigned to task
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if assignee changed and is not null
  IF (TG_OP = 'UPDATE' AND NEW.assignee_id IS DISTINCT FROM OLD.assignee_id AND NEW.assignee_id IS NOT NULL)
     OR (TG_OP = 'INSERT' AND NEW.assignee_id IS NOT NULL) THEN
    
    INSERT INTO public.notifications (user_id, type, payload_json)
    VALUES (
      NEW.assignee_id,
      'task_assigned',
      jsonb_build_object(
        'task_id', NEW.id,
        'task_title', NEW.title,
        'assigned_by', NEW.created_by
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for task assignment notifications
DROP TRIGGER IF EXISTS task_assignment_notification ON public.tasks;
CREATE TRIGGER task_assignment_notification
  AFTER INSERT OR UPDATE OF assignee_id ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_assignment();

-- Create function to send notification when user is mentioned in comment
CREATE OR REPLACE FUNCTION public.notify_comment_mention()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, payload_json)
  VALUES (
    NEW.mentioned_user_id,
    'comment_mention',
    jsonb_build_object(
      'comment_id', NEW.comment_id,
      'task_id', (SELECT task_id FROM comments WHERE id = NEW.comment_id),
      'mentioned_by', (SELECT author_id FROM comments WHERE id = NEW.comment_id)
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for comment mention notifications
DROP TRIGGER IF EXISTS comment_mention_notification ON public.comment_mentions;
CREATE TRIGGER comment_mention_notification
  AFTER INSERT ON public.comment_mentions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_comment_mention();

-- Create function to auto-reschedule overdue tasks
CREATE OR REPLACE FUNCTION public.reschedule_overdue_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_start TIMESTAMPTZ;
BEGIN
  today_start := date_trunc('day', now());
  
  -- Update overdue tasks that are not completed, failed, or blocked
  UPDATE public.tasks
  SET 
    due_at = today_start,
    priority = 'High',
    updated_at = now()
  WHERE 
    due_at < today_start
    AND status NOT IN ('Completed', 'Failed', 'Blocked')
    AND due_at IS NOT NULL;
END;
$$;