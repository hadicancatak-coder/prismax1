-- Add new task statuses to the enum
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'Pending';
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'Failed';

-- Add failure reason column to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS failure_reason text;

-- Add blocker_id column to link tasks with blockers
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS blocker_id uuid REFERENCES public.blockers(id) ON DELETE SET NULL;

-- Add fields to blockers table
ALTER TABLE public.blockers ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.blockers ADD COLUMN IF NOT EXISTS stuck_reason text;
ALTER TABLE public.blockers ADD COLUMN IF NOT EXISTS fix_process text;
ALTER TABLE public.blockers ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;
ALTER TABLE public.blockers ADD COLUMN IF NOT EXISTS timeline text;

-- Update blockers to make description nullable since we now have separate fields
ALTER TABLE public.blockers ALTER COLUMN description DROP NOT NULL;

-- Add fields to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS required_time integer; -- in hours

-- Add update frequency to reports table
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS update_frequency text DEFAULT 'monthly';

-- Make sure title is in blockers
UPDATE public.blockers SET title = COALESCE(title, 'Blocker') WHERE title IS NULL;