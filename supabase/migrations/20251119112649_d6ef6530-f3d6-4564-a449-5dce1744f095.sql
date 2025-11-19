-- Revoke public API access to materialized view
-- This addresses the Supabase linter warning about materialized views in API
REVOKE ALL ON public.task_comment_counts FROM anon, authenticated;

-- Grant select only to service_role for admin access
GRANT SELECT ON public.task_comment_counts TO service_role;

COMMENT ON MATERIALIZED VIEW public.task_comment_counts IS 'Internal materialized view for task comment counts. Not exposed to API.';
