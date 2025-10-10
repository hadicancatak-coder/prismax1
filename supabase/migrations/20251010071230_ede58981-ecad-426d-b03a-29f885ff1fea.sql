-- Fix 1: Add search_path protection to validate_task_input function
CREATE OR REPLACE FUNCTION public.validate_task_input()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Validate title length
  IF length(trim(NEW.title)) < 1 OR length(NEW.title) > 200 THEN
    RAISE EXCEPTION 'Task title must be between 1 and 200 characters';
  END IF;
  
  -- Validate description length if provided
  IF NEW.description IS NOT NULL AND length(NEW.description) > 5000 THEN
    RAISE EXCEPTION 'Task description must not exceed 5000 characters';
  END IF;
  
  -- Trim whitespace
  NEW.title := trim(NEW.title);
  IF NEW.description IS NOT NULL THEN
    NEW.description := trim(NEW.description);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix 2: Restrict user_roles visibility to authenticated users only
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;

CREATE POLICY "Authenticated users can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);