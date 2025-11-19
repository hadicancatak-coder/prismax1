
-- ============================================
-- PHASE 5: SECURITY FIXES & CLEANUP
-- ============================================

-- 1. FIX FUNCTION SEARCH PATHS (5 functions)
-- Add search_path to all functions to prevent SQL injection
ALTER FUNCTION public.log_task_status_change() 
SET search_path = public, pg_temp;

ALTER FUNCTION public.search_content(text, integer) 
SET search_path = public, pg_temp;

ALTER FUNCTION public.update_campaign_entity_tracking_updated_at() 
SET search_path = public, pg_temp;

ALTER FUNCTION public.update_search_vector() 
SET search_path = public, pg_temp;

ALTER FUNCTION public.update_user_task_order_timestamp() 
SET search_path = public, pg_temp;


-- 2. FIX MATERIALIZED VIEW IN API
-- Drop task_comment_counts materialized view from public API
DROP MATERIALIZED VIEW IF EXISTS public.task_comment_counts CASCADE;


-- 3. DROP UNUSED TABLES (Phase 5B cleanup)
-- These tables were confirmed unused in earlier analysis
DROP TABLE IF EXISTS public.location_historic_prices CASCADE;
DROP TABLE IF EXISTS public.location_past_campaigns CASCADE;


-- 4. COMPLETION LOG
DO $$
BEGIN
  RAISE NOTICE 'Phase 5 Security Fixes Complete:';
  RAISE NOTICE '✓ Fixed search_path on 5 functions';
  RAISE NOTICE '✓ Removed task_comment_counts materialized view';
  RAISE NOTICE '✓ Dropped 2 unused location tables';
  RAISE NOTICE 'Note: pg_net extension in public schema is Supabase-managed and cannot be moved';
END $$;
