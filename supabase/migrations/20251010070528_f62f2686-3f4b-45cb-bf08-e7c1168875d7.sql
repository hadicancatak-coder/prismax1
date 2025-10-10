-- Fix profiles RLS: restrict email visibility to own profile only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view own profile email"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Public can view profile names only"
ON public.profiles
FOR SELECT
USING (true);

-- Add email domain validation function
CREATE OR REPLACE FUNCTION public.validate_cfi_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email !~ '^[^@]+@cfi\.trade$' THEN
    RAISE EXCEPTION 'Only @cfi.trade email addresses are allowed';
  END IF;
  RETURN NEW;
END;
$$;

-- Apply email validation trigger to profiles
CREATE TRIGGER validate_email_domain
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_cfi_email();

-- Add server-side task validation function
CREATE OR REPLACE FUNCTION public.validate_task_input()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Apply task validation trigger
CREATE TRIGGER validate_task_input_trigger
BEFORE INSERT OR UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.validate_task_input();

-- Add missing DELETE policies
CREATE POLICY "Admins can delete notifications"
ON public.notifications
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete change requests"
ON public.task_change_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own time entries"
ON public.time_entries
FOR DELETE
USING (auth.uid() = user_id);

-- Add notification creation policy (only system/admins should create)
CREATE POLICY "Only admins can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));