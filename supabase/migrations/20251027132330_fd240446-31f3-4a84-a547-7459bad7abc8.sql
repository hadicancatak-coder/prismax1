-- Add scope_of_work column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN scope_of_work TEXT;

COMMENT ON COLUMN public.profiles.scope_of_work IS 'User responsibilities and scope of work description';