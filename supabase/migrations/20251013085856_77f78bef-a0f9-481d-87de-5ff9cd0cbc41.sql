-- Add RLS policies for avatars storage bucket
-- Allow public read access to all avatars
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Users can only upload to their own folder
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add RLS policies for campaigns storage bucket (admin-only)
CREATE POLICY "Campaign images are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'campaigns');

CREATE POLICY "Only admins can upload campaign images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'campaigns'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Only admins can update campaign images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'campaigns'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Only admins can delete campaign images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'campaigns'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Fix search_path for validate_task_input function (using CASCADE)
DROP FUNCTION IF EXISTS public.validate_task_input() CASCADE;
CREATE OR REPLACE FUNCTION public.validate_task_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Recreate the trigger
CREATE TRIGGER validate_task_input_trigger
BEFORE INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION public.validate_task_input();

-- Fix search_path for update_updated_at_column function (using CASCADE)
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Recreate triggers for update_updated_at_column
CREATE TRIGGER update_blockers_updated_at
BEFORE UPDATE ON blockers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();