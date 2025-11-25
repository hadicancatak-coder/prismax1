-- Fix Task RLS policies to properly support multi-assignee system and ensure no mismatches

-- 1. Make created_by NOT NULL (critical for RLS)
ALTER TABLE tasks ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN created_by SET DEFAULT auth.uid();

-- 2. Drop old policies that reference deprecated assignee_id
DROP POLICY IF EXISTS "Tasks are viewable by authenticated users" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;

-- 3. Create new comprehensive RLS policies for multi-assignee support

-- SELECT: Users can view tasks if:
-- - Task is global visibility, OR
-- - Task is pool visibility, OR  
-- - User is admin, OR
-- - User created the task, OR
-- - User is assigned to the task via task_assignees
CREATE POLICY "Tasks viewable by assigned users and admins"
ON tasks FOR SELECT
TO authenticated
USING (
  visibility = 'global'::task_visibility
  OR visibility = 'pool'::task_visibility
  OR has_role(auth.uid(), 'admin'::app_role)
  OR auth.uid() = created_by
  OR EXISTS (
    SELECT 1 FROM task_assignees ta
    JOIN profiles p ON ta.user_id = p.id
    WHERE ta.task_id = tasks.id 
    AND p.user_id = auth.uid()
  )
);

-- UPDATE: Users can update tasks if:
-- - User is admin, OR
-- - User created the task, OR
-- - User is assigned to the task via task_assignees
CREATE POLICY "Tasks updatable by assigned users and admins"
ON tasks FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR auth.uid() = created_by
  OR EXISTS (
    SELECT 1 FROM task_assignees ta
    JOIN profiles p ON ta.user_id = p.id
    WHERE ta.task_id = tasks.id 
    AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR auth.uid() = created_by
  OR EXISTS (
    SELECT 1 FROM task_assignees ta
    JOIN profiles p ON ta.user_id = p.id
    WHERE ta.task_id = tasks.id 
    AND p.user_id = auth.uid()
  )
);

-- 4. Ensure task_assignees table has proper RLS
ALTER TABLE task_assignees ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if they exist
DROP POLICY IF EXISTS "Task assignees viewable by all authenticated" ON task_assignees;
DROP POLICY IF EXISTS "Admins and task creators can assign" ON task_assignees;
DROP POLICY IF EXISTS "Admins and task creators can remove assignees" ON task_assignees;

-- SELECT: All authenticated users can view task assignments
CREATE POLICY "Task assignees viewable by all authenticated"
ON task_assignees FOR SELECT
TO authenticated
USING (true);

-- INSERT: Admins, task creators, or existing assignees can add assignees
CREATE POLICY "Admins and task creators can assign"
ON task_assignees FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_id 
    AND t.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM task_assignees ta
    JOIN profiles p ON ta.user_id = p.id
    WHERE ta.task_id = task_assignees.task_id 
    AND p.user_id = auth.uid()
  )
);

-- DELETE: Admins, task creators, or the assignee themselves can remove assignments
CREATE POLICY "Admins and task creators can remove assignees"
ON task_assignees FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_id 
    AND t.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = user_id 
    AND p.user_id = auth.uid()
  )
);