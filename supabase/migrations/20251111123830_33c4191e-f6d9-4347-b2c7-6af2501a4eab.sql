-- Fix function search_path issues for functions missing it
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.detect_language(text) SET search_path = public;
ALTER FUNCTION public.auto_detect_element_language() SET search_path = public;
ALTER FUNCTION public.auto_detect_ad_language() SET search_path = public;
ALTER FUNCTION public.get_users_in_teams(text[]) SET search_path = public;
ALTER FUNCTION public.calculate_actual_hours(uuid) SET search_path = public;
ALTER FUNCTION public.notify_team_members_on_task() SET search_path = public;
ALTER FUNCTION public.update_planned_campaigns_updated_at() SET search_path = public;

-- Remove task_comment_counts materialized view from API exposure by revoking access
REVOKE ALL ON public.task_comment_counts FROM anon, authenticated;
GRANT SELECT ON public.task_comment_counts TO authenticated;

-- Add comment explaining the materialized view is for internal use only
COMMENT ON MATERIALIZED VIEW public.task_comment_counts IS 'Internal materialized view for task comment counts. Refreshed periodically. Not for direct API access.';

-- Note: pg_net extension cannot be moved out of public schema as it does not support SET SCHEMA
-- This is a platform limitation and is acceptable for this extension