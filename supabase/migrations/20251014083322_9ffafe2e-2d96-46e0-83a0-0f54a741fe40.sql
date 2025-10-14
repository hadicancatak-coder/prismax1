-- Only add missing columns (foreign keys may already exist from previous migrations)

-- Add Approval Workflow Columns (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tasks' AND column_name = 'approval_requested_at') THEN
    ALTER TABLE public.tasks ADD COLUMN approval_requested_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tasks' AND column_name = 'approval_requested_by') THEN
    ALTER TABLE public.tasks ADD COLUMN approval_requested_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tasks' AND column_name = 'requested_status') THEN
    ALTER TABLE public.tasks ADD COLUMN requested_status task_status;
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_tasks_pending_approval ON public.tasks(pending_approval, approval_requested_at DESC);

-- Create task_type enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_type') THEN
    CREATE TYPE task_type AS ENUM ('task', 'campaign_launch');
  END IF;
END $$;

-- Add Campaign Integration columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tasks' AND column_name = 'task_type') THEN
    ALTER TABLE public.tasks ADD COLUMN task_type task_type DEFAULT 'task';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'tasks' AND column_name = 'campaign_id') THEN
    ALTER TABLE public.tasks ADD COLUMN campaign_id UUID REFERENCES public.launch_pad_campaigns(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'launch_pad_campaigns' AND column_name = 'converted_to_task') THEN
    ALTER TABLE public.launch_pad_campaigns ADD COLUMN converted_to_task BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'launch_pad_campaigns' AND column_name = 'task_id') THEN
    ALTER TABLE public.launch_pad_campaigns ADD COLUMN task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_tasks_campaign_id ON public.tasks(campaign_id) WHERE campaign_id IS NOT NULL;