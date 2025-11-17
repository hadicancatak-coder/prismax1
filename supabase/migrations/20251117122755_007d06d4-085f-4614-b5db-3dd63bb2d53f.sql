-- Fix log_task_changes to handle NULL changed_by (for system-generated tasks)
CREATE OR REPLACE FUNCTION public.log_task_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  changer_id UUID;
BEGIN
  -- Get the user making the change, or use the task creator for system-generated tasks
  changer_id := COALESCE(auth.uid(), NEW.created_by);
  
  -- If this is an INSERT, log task creation
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.task_change_logs (task_id, changed_by, field_name, old_value, new_value, change_type, description)
    VALUES (NEW.id, changer_id, 'task', NULL, to_jsonb(NEW), 'created', 'Task created');
    RETURN NEW;
  END IF;
  
  -- For UPDATE, log specific field changes
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.task_change_logs (task_id, changed_by, field_name, old_value, new_value, change_type, description)
    VALUES (
      NEW.id, 
      changer_id, 
      'status', 
      to_jsonb(OLD.status), 
      to_jsonb(NEW.status), 
      'status_changed', 
      'Status changed from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;
  
  IF NEW.priority IS DISTINCT FROM OLD.priority THEN
    INSERT INTO public.task_change_logs (task_id, changed_by, field_name, old_value, new_value, change_type, description)
    VALUES (
      NEW.id, 
      changer_id, 
      'priority', 
      to_jsonb(OLD.priority), 
      to_jsonb(NEW.priority), 
      'priority_changed', 
      'Priority changed from ' || OLD.priority || ' to ' || NEW.priority
    );
  END IF;
  
  IF NEW.assignee_id IS DISTINCT FROM OLD.assignee_id THEN
    INSERT INTO public.task_change_logs (task_id, changed_by, field_name, old_value, new_value, change_type, description)
    VALUES (
      NEW.id, 
      changer_id, 
      'assignee', 
      to_jsonb(OLD.assignee_id), 
      to_jsonb(NEW.assignee_id), 
      'assigned', 
      CASE 
        WHEN NEW.assignee_id IS NULL THEN 'Assignee removed'
        WHEN OLD.assignee_id IS NULL THEN 'Assignee added'
        ELSE 'Assignee changed'
      END
    );
  END IF;
  
  IF NEW.due_at IS DISTINCT FROM OLD.due_at THEN
    INSERT INTO public.task_change_logs (task_id, changed_by, field_name, old_value, new_value, change_type, description)
    VALUES (
      NEW.id, 
      changer_id, 
      'due_date', 
      to_jsonb(OLD.due_at), 
      to_jsonb(NEW.due_at), 
      'due_date_changed', 
      CASE 
        WHEN NEW.due_at IS NULL THEN 'Due date removed'
        WHEN OLD.due_at IS NULL THEN 'Due date added'
        ELSE 'Due date changed'
      END
    );
  END IF;
  
  IF NEW.title IS DISTINCT FROM OLD.title THEN
    INSERT INTO public.task_change_logs (task_id, changed_by, field_name, old_value, new_value, change_type, description)
    VALUES (
      NEW.id, 
      changer_id, 
      'title', 
      to_jsonb(OLD.title), 
      to_jsonb(NEW.title), 
      'title_changed', 
      'Title updated'
    );
  END IF;
  
  IF NEW.description IS DISTINCT FROM OLD.description THEN
    INSERT INTO public.task_change_logs (task_id, changed_by, field_name, old_value, new_value, change_type, description)
    VALUES (
      NEW.id, 
      changer_id, 
      'description', 
      NULL,
      NULL,
      'description_changed', 
      'Description updated'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Now generate the recurring tasks
SELECT generate_recurring_tasks();