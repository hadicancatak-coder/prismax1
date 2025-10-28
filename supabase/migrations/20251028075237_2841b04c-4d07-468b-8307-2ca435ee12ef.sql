-- Create operation_audit_logs table
CREATE TABLE public.operation_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  entity TEXT[] DEFAULT '{}',
  platform TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deadline TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress',
  CHECK (status IN ('in_progress', 'completed', 'archived'))
);

-- Create operation_audit_items table
CREATE TABLE public.operation_audit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id UUID REFERENCES public.operation_audit_logs(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  assigned_to UUID REFERENCES public.profiles(id),
  task_id UUID REFERENCES public.tasks(id),
  completed_by UUID REFERENCES public.profiles(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  order_index INTEGER DEFAULT 0,
  CHECK (status IN ('pending', 'completed', 'failed'))
);

-- Create platform team mapping table
CREATE TABLE public.platform_team_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  team_name TEXT NOT NULL,
  default_assignees UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(platform, team_name)
);

-- Enable RLS
ALTER TABLE public.operation_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_audit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_team_mapping ENABLE ROW LEVEL SECURITY;

-- RLS Policies for operation_audit_logs
CREATE POLICY "Authenticated users can view audit logs"
  ON public.operation_audit_logs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage audit logs"
  ON public.operation_audit_logs FOR ALL
  TO authenticated USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for operation_audit_items
CREATE POLICY "Authenticated users can view audit items"
  ON public.operation_audit_items FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage audit items"
  ON public.operation_audit_items FOR ALL
  TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Assigned users can update their items"
  ON public.operation_audit_items FOR UPDATE
  TO authenticated USING (
    assigned_to IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- RLS Policies for platform_team_mapping
CREATE POLICY "Authenticated users can view platform mappings"
  ON public.platform_team_mapping FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage platform mappings"
  ON public.platform_team_mapping FOR ALL
  TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_operation_audit_logs_updated_at
  BEFORE UPDATE ON public.operation_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();