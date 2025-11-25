-- Fix existing recurring tasks that have recurrence_rrule but wrong task_type
UPDATE tasks 
SET task_type = 'recurring' 
WHERE recurrence_rrule IS NOT NULL 
  AND task_type != 'recurring';