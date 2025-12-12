-- Disable the task status change notification triggers that are blocking task updates
-- Error: "Key (user_id)=(9f498e6d-1b01-4e30-b6c6-d49349fff06f) is not present in table users"
-- The triggers try to insert notifications with invalid user_ids

DROP TRIGGER IF EXISTS task_status_change_notification ON public.tasks;
DROP TRIGGER IF EXISTS notify_task_status_changed ON public.tasks;
DROP TRIGGER IF EXISTS task_field_updates_notification ON public.tasks;