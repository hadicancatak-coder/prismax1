-- Phase 3.1: Task Dependencies
CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'blocks',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(task_id, depends_on_task_id),
  CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id)
);

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dependencies viewable by authenticated users"
ON public.task_dependencies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create dependencies"
ON public.task_dependencies FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete dependencies"
ON public.task_dependencies FOR DELETE TO authenticated
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'));

-- Phase 3.2: Task Templates
CREATE TABLE IF NOT EXISTS public.task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  default_priority task_priority DEFAULT 'Medium',
  default_assignee_id UUID REFERENCES auth.users(id),
  estimated_hours DECIMAL(5,2),
  checklist_items JSONB DEFAULT '[]'::jsonb,
  labels TEXT[] DEFAULT '{}'::text[],
  entity TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_public BOOLEAN DEFAULT false
);

ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates viewable by authenticated users"
ON public.task_templates FOR SELECT TO authenticated
USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Users can create own templates"
ON public.task_templates FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own templates"
ON public.task_templates FOR UPDATE TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own templates"
ON public.task_templates FOR DELETE TO authenticated
USING (auth.uid() = created_by);

-- Phase 3.3: Time Tracking Enhancement
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,2);

CREATE OR REPLACE FUNCTION calculate_actual_hours(task_uuid UUID)
RETURNS DECIMAL(5,2)
LANGUAGE SQL
STABLE
AS $$
  SELECT COALESCE(SUM(seconds::decimal / 3600), 0)::decimal(5,2)
  FROM time_entries
  WHERE task_id = task_uuid
$$;

-- Phase 3.4: Task Checklist
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;

-- Phase 3.5: Add full-text search index
CREATE INDEX IF NOT EXISTS tasks_search_idx ON tasks 
USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '')));