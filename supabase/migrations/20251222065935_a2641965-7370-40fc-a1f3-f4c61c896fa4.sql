-- Add 'External Dependency' to task status enum
-- First, let's add a new status value to handle external dependencies

-- Option 1: Add a new column for dependency_reason to mark tasks as waiting on external party
-- This is cleaner than modifying the status enum
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS external_dependency_reason TEXT DEFAULT NULL;

-- Also add a boolean flag for quick filtering
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_external_dependency BOOLEAN DEFAULT FALSE;

-- Add a comment explaining the purpose
COMMENT ON COLUMN public.tasks.external_dependency_reason IS 'Reason why task is waiting on external party';
COMMENT ON COLUMN public.tasks.is_external_dependency IS 'Flag indicating task is blocked waiting on external party';