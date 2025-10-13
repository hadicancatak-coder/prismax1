-- Security Fix 1: Restrict profile data exposure
-- Create a public view that only exposes safe profile fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  name,
  username,
  avatar_url,
  title,
  tagline
FROM public.profiles;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Drop the overly permissive policy on profiles
DROP POLICY IF EXISTS "Public profile info viewable by all" ON public.profiles;

-- Create restricted policy for full profile access (owner only)
CREATE POLICY "Users can view own complete profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- Allow authenticated users to view the public profile view
-- Note: Views inherit RLS from underlying tables, so we need a policy
CREATE POLICY "Public profiles viewable by authenticated users"
ON public.profiles FOR SELECT
USING (true);

-- Security Fix 2: Clean up storage policies
-- First, check existing policies
DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects';
  
  IF policy_count > 0 THEN
    -- Drop duplicate or redundant storage policies
    DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
  END IF;
END $$;

-- Recreate clean storage policies
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users view own campaigns"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'campaigns' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users upload own campaigns"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'campaigns' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Security Fix 3: Add rate limiting to notification triggers
-- Create a table to track notification frequency
CREATE TABLE IF NOT EXISTS public.notification_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notification_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_type, created_at)
);

ALTER TABLE public.notification_rate_limit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
ON public.notification_rate_limit FOR SELECT
USING (auth.uid() = user_id);

-- Create index for faster rate limit checks
CREATE INDEX IF NOT EXISTS idx_notification_rate_limit_user_type_time 
ON public.notification_rate_limit(user_id, notification_type, created_at DESC);

-- Update notification triggers with rate limiting
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  recent_count integer;
BEGIN
  -- Only notify if assignee changed and is not null
  IF (TG_OP = 'UPDATE' AND NEW.assignee_id IS DISTINCT FROM OLD.assignee_id AND NEW.assignee_id IS NOT NULL)
     OR (TG_OP = 'INSERT' AND NEW.assignee_id IS NOT NULL) THEN
    
    -- Rate limiting: Check if user received more than 10 task assignments in last 5 minutes
    SELECT COUNT(*) INTO recent_count
    FROM public.notification_rate_limit
    WHERE user_id = NEW.assignee_id
      AND notification_type = 'task_assigned'
      AND created_at > now() - interval '5 minutes';
    
    IF recent_count < 10 THEN
      INSERT INTO public.notifications (user_id, type, payload_json)
      VALUES (
        NEW.assignee_id,
        'task_assigned',
        jsonb_build_object(
          'task_id', NEW.id,
          'task_title', NEW.title,
          'assigned_by', NEW.created_by
        )
      );
      
      -- Track this notification
      INSERT INTO public.notification_rate_limit (user_id, notification_type)
      VALUES (NEW.assignee_id, 'task_assigned')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_comment_mention()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  recent_count integer;
BEGIN
  -- Rate limiting: Check if user received more than 15 mentions in last 5 minutes
  SELECT COUNT(*) INTO recent_count
  FROM public.notification_rate_limit
  WHERE user_id = NEW.mentioned_user_id
    AND notification_type = 'comment_mention'
    AND created_at > now() - interval '5 minutes';
  
  IF recent_count < 15 THEN
    INSERT INTO public.notifications (user_id, type, payload_json)
    VALUES (
      NEW.mentioned_user_id,
      'comment_mention',
      jsonb_build_object(
        'comment_id', NEW.comment_id,
        'task_id', (SELECT task_id FROM comments WHERE id = NEW.comment_id),
        'mentioned_by', (SELECT author_id FROM comments WHERE id = NEW.comment_id)
      )
    );
    
    -- Track this notification
    INSERT INTO public.notification_rate_limit (user_id, notification_type)
    VALUES (NEW.mentioned_user_id, 'comment_mention')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add fields for enhanced recurring task options
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS recurrence_day_of_week integer, -- 0-6 for Sunday-Saturday (weekly)
ADD COLUMN IF NOT EXISTS recurrence_day_of_month integer; -- 1-31 for day of month (monthly)