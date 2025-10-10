-- Add members field to projects table
ALTER TABLE public.projects
ADD COLUMN members uuid[] DEFAULT '{}';

COMMENT ON COLUMN public.projects.members IS 'Array of user IDs assigned to this project';