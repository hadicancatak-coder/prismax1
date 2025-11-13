-- Create user_task_order table for per-user task ordering
CREATE TABLE IF NOT EXISTS public.user_task_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  date_scope text NOT NULL, -- 'today', 'week', 'month', 'custom'
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, task_id, date_scope)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_task_order_user_date ON public.user_task_order(user_id, date_scope);
CREATE INDEX IF NOT EXISTS idx_user_task_order_task ON public.user_task_order(task_id);

-- Enable RLS
ALTER TABLE public.user_task_order ENABLE ROW LEVEL SECURITY;

-- Users can view their own task order
CREATE POLICY "Users can view own task order"
  ON public.user_task_order
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own task order
CREATE POLICY "Users can create own task order"
  ON public.user_task_order
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own task order
CREATE POLICY "Users can update own task order"
  ON public.user_task_order
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own task order
CREATE POLICY "Users can delete own task order"
  ON public.user_task_order
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all task orders
CREATE POLICY "Admins can view all task orders"
  ON public.user_task_order
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create task_activity_log table for tracking user actions
CREATE TABLE IF NOT EXISTS public.task_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL, -- 'completed', 'status_changed', 'created', 'assigned'
  old_value text,
  new_value text,
  timestamp timestamptz DEFAULT now()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_task_activity_user_timestamp ON public.task_activity_log(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_task_activity_task ON public.task_activity_log(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_action ON public.task_activity_log(action_type, timestamp DESC);

-- Enable RLS
ALTER TABLE public.task_activity_log ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view activity logs
CREATE POLICY "Authenticated users can view activity logs"
  ON public.task_activity_log
  FOR SELECT
  USING (true);

-- System can insert activity logs
CREATE POLICY "System can insert activity logs"
  ON public.task_activity_log
  FOR INSERT
  WITH CHECK (true);

-- Admins can manage activity logs
CREATE POLICY "Admins can manage activity logs"
  ON public.task_activity_log
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to automatically log task status changes
CREATE OR REPLACE FUNCTION log_task_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.task_activity_log (task_id, user_id, action_type, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status_changed', OLD.status::text, NEW.status::text);
  END IF;
  
  -- Log task creation
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.task_activity_log (task_id, user_id, action_type, new_value)
    VALUES (NEW.id, NEW.created_by, 'created', NEW.status::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic logging
DROP TRIGGER IF EXISTS task_status_change_trigger ON public.tasks;
CREATE TRIGGER task_status_change_trigger
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_status_change();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_task_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_task_order updated_at
DROP TRIGGER IF EXISTS update_user_task_order_timestamp_trigger ON public.user_task_order;
CREATE TRIGGER update_user_task_order_timestamp_trigger
  BEFORE UPDATE ON public.user_task_order
  FOR EACH ROW
  EXECUTE FUNCTION update_user_task_order_timestamp();