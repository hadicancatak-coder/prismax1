-- Drop QA-related database functions and columns
DROP FUNCTION IF EXISTS public.seed_qa_test_data();
DROP FUNCTION IF EXISTS public.purge_qa_test_data();
DROP FUNCTION IF EXISTS public.get_foreign_keys_info();

-- Remove qa_tag column from tables
ALTER TABLE public.tasks DROP COLUMN IF EXISTS qa_tag;
ALTER TABLE public.ads DROP COLUMN IF EXISTS qa_tag;
ALTER TABLE public.launch_pad_campaigns DROP COLUMN IF EXISTS qa_tag;