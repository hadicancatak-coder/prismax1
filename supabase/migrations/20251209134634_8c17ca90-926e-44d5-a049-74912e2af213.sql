-- Drop existing restrictive task policies
DROP POLICY IF EXISTS "Tasks viewable by assigned users and admins" ON public.tasks;
DROP POLICY IF EXISTS "Tasks updatable by assigned users and admins" ON public.tasks;
DROP POLICY IF EXISTS "Admins can create tasks directly" ON public.tasks;
DROP POLICY IF EXISTS "Members can create tasks (goes to approval)" ON public.tasks;
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.tasks;

-- Create new permissive policies for all authenticated users
CREATE POLICY "All authenticated users can view all tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can create tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "All authenticated users can update tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "All authenticated users can delete tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING (true);