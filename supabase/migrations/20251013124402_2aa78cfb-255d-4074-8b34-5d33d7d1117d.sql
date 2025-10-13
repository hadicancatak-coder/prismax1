-- Phase 1: Foundation - Database Schema & Activity Tracking

-- 1. Create team enum
CREATE TYPE public.team AS ENUM ('SocialUA', 'PPC', 'PerMar');

-- 2. Add teams to profiles
ALTER TABLE public.profiles ADD COLUMN teams public.team[] DEFAULT '{}';

-- 3. Add updated_by tracking to all main tables
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE public.blockers ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- 4. Create multi-assignee junction tables
CREATE TABLE public.task_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(task_id, user_id)
);

CREATE TABLE public.project_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(project_id, user_id)
);

CREATE TABLE public.campaign_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(campaign_id, user_id)
);

CREATE TABLE public.blocker_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES public.blockers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(blocker_id, user_id)
);

-- 5. Create activity logs table
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  field_name text,
  old_value text,
  new_value text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 6. Enable RLS on new tables
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocker_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 7. RLS policies for assignee tables
CREATE POLICY "Assignees viewable by authenticated users"
  ON public.task_assignees FOR SELECT
  USING (true);

CREATE POLICY "Users can assign to tasks"
  ON public.task_assignees FOR INSERT
  WITH CHECK (auth.uid() = assigned_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can unassign from tasks"
  ON public.task_assignees FOR DELETE
  USING (auth.uid() = assigned_by OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Project assignees viewable by authenticated users"
  ON public.project_assignees FOR SELECT
  USING (true);

CREATE POLICY "Admins can assign to projects"
  ON public.project_assignees FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can unassign from projects"
  ON public.project_assignees FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Campaign assignees viewable by authenticated users"
  ON public.campaign_assignees FOR SELECT
  USING (true);

CREATE POLICY "Admins can assign to campaigns"
  ON public.campaign_assignees FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can unassign from campaigns"
  ON public.campaign_assignees FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Blocker assignees viewable by authenticated users"
  ON public.blocker_assignees FOR SELECT
  USING (true);

CREATE POLICY "Users can assign to blockers"
  ON public.blocker_assignees FOR INSERT
  WITH CHECK (auth.uid() = assigned_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can unassign from blockers"
  ON public.blocker_assignees FOR DELETE
  USING (auth.uid() = assigned_by OR auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 8. RLS policies for activity logs
CREATE POLICY "Activity logs viewable by authenticated users"
  ON public.activity_logs FOR SELECT
  USING (true);

CREATE POLICY "System can create activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true);

-- 9. Create indexes for performance
CREATE INDEX idx_task_assignees_task_id ON public.task_assignees(task_id);
CREATE INDEX idx_task_assignees_user_id ON public.task_assignees(user_id);
CREATE INDEX idx_project_assignees_project_id ON public.project_assignees(project_id);
CREATE INDEX idx_project_assignees_user_id ON public.project_assignees(user_id);
CREATE INDEX idx_campaign_assignees_campaign_id ON public.campaign_assignees(campaign_id);
CREATE INDEX idx_campaign_assignees_user_id ON public.campaign_assignees(user_id);
CREATE INDEX idx_blocker_assignees_blocker_id ON public.blocker_assignees(blocker_id);
CREATE INDEX idx_blocker_assignees_user_id ON public.blocker_assignees(user_id);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- 10. Create function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_field_name text DEFAULT NULL,
  p_old_value text DEFAULT NULL,
  p_new_value text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.activity_logs (
    user_id, action, entity_type, entity_id, 
    field_name, old_value, new_value, metadata
  )
  VALUES (
    p_user_id, p_action, p_entity_type, p_entity_id,
    p_field_name, p_old_value, p_new_value, p_metadata
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- 11. Create triggers for auto-tracking updates
CREATE OR REPLACE FUNCTION public.track_task_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_by = auth.uid();
  
  IF TG_OP = 'UPDATE' THEN
    IF NEW.title IS DISTINCT FROM OLD.title THEN
      PERFORM log_activity(auth.uid(), 'updated', 'task', NEW.id, 'title', OLD.title, NEW.title);
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      PERFORM log_activity(auth.uid(), 'updated', 'task', NEW.id, 'status', OLD.status::text, NEW.status::text);
    END IF;
    IF NEW.priority IS DISTINCT FROM OLD.priority THEN
      PERFORM log_activity(auth.uid(), 'updated', 'task', NEW.id, 'priority', OLD.priority::text, NEW.priority::text);
    END IF;
    IF NEW.assignee_id IS DISTINCT FROM OLD.assignee_id THEN
      PERFORM log_activity(auth.uid(), 'updated', 'task', NEW.id, 'assignee', OLD.assignee_id::text, NEW.assignee_id::text);
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM log_activity(auth.uid(), 'created', 'task', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_project_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_by = auth.uid();
  
  IF TG_OP = 'UPDATE' THEN
    IF NEW.name IS DISTINCT FROM OLD.name THEN
      PERFORM log_activity(auth.uid(), 'updated', 'project', NEW.id, 'name', OLD.name, NEW.name);
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM log_activity(auth.uid(), 'created', 'project', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_campaign_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_by = auth.uid();
  
  IF TG_OP = 'UPDATE' THEN
    IF NEW.title IS DISTINCT FROM OLD.title THEN
      PERFORM log_activity(auth.uid(), 'updated', 'campaign', NEW.id, 'title', OLD.title, NEW.title);
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM log_activity(auth.uid(), 'created', 'campaign', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_blocker_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_by = auth.uid();
  
  IF TG_OP = 'UPDATE' THEN
    IF NEW.title IS DISTINCT FROM OLD.title THEN
      PERFORM log_activity(auth.uid(), 'updated', 'blocker', NEW.id, 'title', OLD.title, NEW.title);
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM log_activity(auth.uid(), 'created', 'blocker', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- 12. Attach triggers
CREATE TRIGGER track_task_changes_trigger
  BEFORE INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.track_task_changes();

CREATE TRIGGER track_project_changes_trigger
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.track_project_changes();

CREATE TRIGGER track_campaign_changes_trigger
  BEFORE INSERT OR UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.track_campaign_changes();

CREATE TRIGGER track_blocker_changes_trigger
  BEFORE INSERT OR UPDATE ON public.blockers
  FOR EACH ROW
  EXECUTE FUNCTION public.track_blocker_changes();

-- 13. Create function to track assignment changes
CREATE OR REPLACE FUNCTION public.track_assignment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entity_type text;
  entity_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'task_assignees' THEN
    entity_type := 'task';
    entity_id := COALESCE(NEW.task_id, OLD.task_id);
  ELSIF TG_TABLE_NAME = 'project_assignees' THEN
    entity_type := 'project';
    entity_id := COALESCE(NEW.project_id, OLD.project_id);
  ELSIF TG_TABLE_NAME = 'campaign_assignees' THEN
    entity_type := 'campaign';
    entity_id := COALESCE(NEW.campaign_id, OLD.campaign_id);
  ELSIF TG_TABLE_NAME = 'blocker_assignees' THEN
    entity_type := 'blocker';
    entity_id := COALESCE(NEW.blocker_id, OLD.blocker_id);
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    PERFORM log_activity(
      NEW.assigned_by,
      'assigned',
      entity_type,
      entity_id,
      'assignee',
      NULL,
      NEW.user_id::text,
      jsonb_build_object('assigned_user_id', NEW.user_id)
    );
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_activity(
      auth.uid(),
      'unassigned',
      entity_type,
      entity_id,
      'assignee',
      OLD.user_id::text,
      NULL,
      jsonb_build_object('unassigned_user_id', OLD.user_id)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 14. Attach assignment tracking triggers
CREATE TRIGGER track_task_assignment_trigger
  AFTER INSERT OR DELETE ON public.task_assignees
  FOR EACH ROW
  EXECUTE FUNCTION public.track_assignment_changes();

CREATE TRIGGER track_project_assignment_trigger
  AFTER INSERT OR DELETE ON public.project_assignees
  FOR EACH ROW
  EXECUTE FUNCTION public.track_assignment_changes();

CREATE TRIGGER track_campaign_assignment_trigger
  AFTER INSERT OR DELETE ON public.campaign_assignees
  FOR EACH ROW
  EXECUTE FUNCTION public.track_assignment_changes();

CREATE TRIGGER track_blocker_assignment_trigger
  AFTER INSERT OR DELETE ON public.blocker_assignees
  FOR EACH ROW
  EXECUTE FUNCTION public.track_assignment_changes();

-- 15. Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_assignees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_assignees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_assignees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocker_assignees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;