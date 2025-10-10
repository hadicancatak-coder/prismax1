-- Add project_id to tasks table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.tasks ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create project_timelines table
CREATE TABLE IF NOT EXISTS public.project_timelines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_name text NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on project_timelines
ALTER TABLE public.project_timelines ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Timelines viewable by authenticated users" ON public.project_timelines;
DROP POLICY IF EXISTS "Admins can manage timelines" ON public.project_timelines;

-- Timeline policies
CREATE POLICY "Timelines viewable by authenticated users"
  ON public.project_timelines FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage timelines"
  ON public.project_timelines FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for project_timelines
ALTER PUBLICATION supabase_realtime ADD TABLE project_timelines;