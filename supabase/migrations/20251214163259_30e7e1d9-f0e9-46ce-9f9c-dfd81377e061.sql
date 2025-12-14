-- Nuclear fix: Drop ALL notification triggers that are causing foreign key violations
-- These triggers attempt to insert notifications with incorrect user_id references

-- Drop all 6 notification triggers from tasks table
DROP TRIGGER IF EXISTS notify_on_task_field_updates ON public.tasks;
DROP TRIGGER IF EXISTS task_assignment_notification ON public.tasks;
DROP TRIGGER IF EXISTS task_team_assignment_trigger ON public.tasks;
DROP TRIGGER IF EXISTS trigger_notify_task_deadline ON public.tasks;
DROP TRIGGER IF EXISTS trigger_notify_task_priority ON public.tasks;
DROP TRIGGER IF EXISTS trigger_notify_task_status ON public.tasks;

-- Drop the notification trigger from task_assignees table
DROP TRIGGER IF EXISTS trigger_notify_task_assigned ON public.task_assignees;