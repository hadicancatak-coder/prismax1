-- Phase 1: Fix KPI System Database Schema

-- Make user_id nullable to support team assignments
ALTER TABLE kpi_assignments 
  ALTER COLUMN user_id DROP NOT NULL;

-- Add team_name column for team assignments
ALTER TABLE kpi_assignments 
  ADD COLUMN IF NOT EXISTS team_name text;

-- Add status column for tracking assignment status
ALTER TABLE kpi_assignments 
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add notes column for additional context
ALTER TABLE kpi_assignments 
  ADD COLUMN IF NOT EXISTS notes text;

-- Add check constraint to ensure either user_id or team_name is set
ALTER TABLE kpi_assignments 
  ADD CONSTRAINT kpi_assignments_target_check 
  CHECK (
    (user_id IS NOT NULL AND team_name IS NULL) OR 
    (user_id IS NULL AND team_name IS NOT NULL)
  );

-- Update RLS policies to handle team assignments
DROP POLICY IF EXISTS "Users can view their own KPI assignments" ON kpi_assignments;

CREATE POLICY "Users can view their own KPI assignments"
  ON kpi_assignments FOR SELECT
  USING (
    user_id = auth.uid() OR
    has_role(auth.uid(), 'admin'::app_role)
  );