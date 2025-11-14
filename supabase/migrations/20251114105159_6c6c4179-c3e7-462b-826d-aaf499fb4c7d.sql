-- Fix status_logs created_by column to prevent 400 errors
-- Make created_by non-nullable and set default to auth.uid()

ALTER TABLE status_logs 
ALTER COLUMN created_by SET NOT NULL,
ALTER COLUMN created_by SET DEFAULT auth.uid();