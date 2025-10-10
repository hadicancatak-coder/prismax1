-- Add "Failed" status to task_status enum
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'Failed';

-- Add entity column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS entity text;

-- Add blocker_reason column to tasks table (for when status is Blocked)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS blocker_reason text;