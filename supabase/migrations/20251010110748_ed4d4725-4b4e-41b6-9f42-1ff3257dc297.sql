-- Add delete request status to tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS delete_requested_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS delete_requested_at timestamp with time zone;

COMMENT ON COLUMN public.tasks.delete_requested_by IS 'User who requested task deletion';
COMMENT ON COLUMN public.tasks.delete_requested_at IS 'Timestamp when deletion was requested';