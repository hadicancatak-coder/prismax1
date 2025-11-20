-- Drop existing policy that doesn't check task_assignees
DROP POLICY IF EXISTS "Users can update tasks" ON public.tasks;

-- Create new policy that includes task_assignees check
-- This allows users assigned via the junction table to update tasks
CREATE POLICY "Users can update tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by 
  OR auth.uid() = assignee_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.task_assignees ta
    INNER JOIN public.profiles p ON ta.user_id = p.id
    WHERE ta.task_id = tasks.id 
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = created_by 
  OR auth.uid() = assignee_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.task_assignees ta
    INNER JOIN public.profiles p ON ta.user_id = p.id
    WHERE ta.task_id = tasks.id 
      AND p.user_id = auth.uid()
  )
);