-- Fix duplicate notification triggers
-- Drop duplicate triggers on comment_mentions table (keep comment_mention_notification)
DROP TRIGGER IF EXISTS trigger_notify_comment_mention ON public.comment_mentions;

-- Drop duplicate triggers on comments table (keep notify_on_task_comment)
DROP TRIGGER IF EXISTS trigger_notify_task_comment ON public.comments;

-- Also drop notify_task_creator_comment if it exists (consolidate into one trigger)
DROP TRIGGER IF EXISTS notify_task_creator_comment ON public.comments;

-- Clean up existing duplicate notifications from the last day (keep only the first one)
DELETE FROM public.notifications a
USING public.notifications b
WHERE a.id > b.id
  AND a.user_id = b.user_id
  AND a.type = b.type
  AND a.payload_json->>'task_id' = b.payload_json->>'task_id'
  AND a.payload_json->>'comment_id' IS NOT NULL
  AND a.payload_json->>'comment_id' = b.payload_json->>'comment_id'
  AND a.created_at > NOW() - INTERVAL '1 day';