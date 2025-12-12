-- Drop the incorrectly attached trigger from tasks table
-- This trigger was meant for blockers table but was attached to tasks,
-- causing all task updates to fail with "record has no field resolved" error
DROP TRIGGER IF EXISTS blocker_resolved_trigger ON public.tasks;