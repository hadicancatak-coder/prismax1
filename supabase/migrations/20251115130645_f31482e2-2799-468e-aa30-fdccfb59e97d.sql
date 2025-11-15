-- Fix KPI assignment RLS policies and assigned_by column

-- Step 1: Drop existing broken policies
DROP POLICY IF EXISTS "Users can view their own KPI assignments" ON kpi_assignments;
DROP POLICY IF EXISTS "Admins can manage all KPI assignments" ON kpi_assignments;

-- Step 2: Update any NULL assigned_by values (set to first admin user)
UPDATE kpi_assignments 
SET assigned_by = (
  SELECT p.id 
  FROM profiles p 
  JOIN user_roles ur ON p.user_id = ur.user_id 
  WHERE ur.role = 'admin' 
  LIMIT 1
)
WHERE assigned_by IS NULL;

-- Step 3: Make assigned_by NOT NULL
ALTER TABLE kpi_assignments 
ALTER COLUMN assigned_by SET NOT NULL;

-- Step 4: Create correct RLS policies
CREATE POLICY "Admins can manage all KPI assignments"
ON kpi_assignments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their assigned KPIs"
ON kpi_assignments
FOR SELECT
TO authenticated
USING (
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);