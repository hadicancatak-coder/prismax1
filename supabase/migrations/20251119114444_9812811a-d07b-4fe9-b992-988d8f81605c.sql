-- Restore SELECT permission for authenticated users on task_comment_counts
-- This was revoked in a previous migration but is needed for the useTasks hook
-- which joins with this materialized view to display comment counts

GRANT SELECT ON public.task_comment_counts TO authenticated;

-- Add comment explaining why this permission is required
COMMENT ON MATERIALIZED VIEW public.task_comment_counts IS 
'Materialized view for task comment counts. Requires SELECT permission for authenticated users because useTasks hook joins with this view to efficiently display comment counts without N+1 queries.';