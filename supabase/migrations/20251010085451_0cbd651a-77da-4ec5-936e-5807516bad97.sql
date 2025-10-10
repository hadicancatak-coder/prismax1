-- Add username to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);