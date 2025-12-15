-- Add tracking columns to knowledge_pages for public access tracking
ALTER TABLE public.knowledge_pages
ADD COLUMN IF NOT EXISTS click_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_accessed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reviewer_name text,
ADD COLUMN IF NOT EXISTS reviewer_email text;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_knowledge_pages_is_public ON public.knowledge_pages(is_public);

-- Clean up all existing external links (as requested)
DELETE FROM public.campaign_external_access;

-- Reset public status on all knowledge pages (clean slate)
UPDATE public.knowledge_pages SET is_public = false, public_token = NULL, click_count = 0, last_accessed_at = NULL, reviewer_name = NULL, reviewer_email = NULL;