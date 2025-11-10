-- Create task change logs table for tracking all task modifications
CREATE TABLE IF NOT EXISTS public.task_change_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  field_name TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  change_type TEXT NOT NULL, -- 'created', 'updated', 'status_changed', 'assigned', 'priority_changed', etc.
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_change_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can view change logs for tasks they can access
CREATE POLICY "Change logs viewable by authenticated users"
  ON public.task_change_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE id = task_change_logs.task_id
      AND (
        visibility = 'global'::task_visibility
        OR visibility = 'pool'::task_visibility
        OR (visibility = 'private'::task_visibility AND has_role(auth.uid(), 'admin'::app_role))
      )
    )
  );

-- RLS Policy: System can insert change logs
CREATE POLICY "System can insert change logs"
  ON public.task_change_logs FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_task_change_logs_task_id ON public.task_change_logs(task_id);
CREATE INDEX idx_task_change_logs_changed_at ON public.task_change_logs(changed_at DESC);

-- Create trigger function to automatically log task changes
CREATE OR REPLACE FUNCTION public.log_task_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changer_id UUID;
BEGIN
  -- Get the user making the change
  changer_id := auth.uid();
  
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
      NULL, -- Don't store full description in logs
      NULL,
      'description_changed', 
      'Description updated'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on tasks table
DROP TRIGGER IF EXISTS track_task_changes_detailed ON public.tasks;
CREATE TRIGGER track_task_changes_detailed
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_task_changes();

-- Add order_index column to tasks table for drag-drop ordering
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;