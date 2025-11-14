-- Fix status_logs check constraint to include 'brief' log type
-- Drop the old constraint that's missing 'brief'
ALTER TABLE status_logs 
DROP CONSTRAINT status_logs_log_type_check;

-- Recreate with 'brief' included
ALTER TABLE status_logs 
ADD CONSTRAINT status_logs_log_type_check 
CHECK (log_type = ANY (ARRAY['issue'::text, 'blocker'::text, 'plan'::text, 'update'::text, 'note'::text, 'brief'::text]));