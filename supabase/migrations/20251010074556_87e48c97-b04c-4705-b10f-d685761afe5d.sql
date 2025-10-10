-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects viewable by authenticated users"
ON public.projects FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can create projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update projects"
ON public.projects FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete projects"
ON public.projects FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Add project_id to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create blockers table
CREATE TABLE IF NOT EXISTS public.blockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blockers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blockers viewable by authenticated users"
ON public.blockers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create blockers"
ON public.blockers FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own blockers"
ON public.blockers FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Admins can update any blocker"
ON public.blockers FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own blockers"
ON public.blockers FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Create trigger for blockers updated_at
CREATE TRIGGER update_blockers_updated_at
  BEFORE UPDATE ON public.blockers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for projects updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();