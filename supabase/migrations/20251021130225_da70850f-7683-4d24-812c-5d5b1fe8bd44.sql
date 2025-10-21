-- Add expansion_group_id column to utm_links table for grouping bulk-created links
ALTER TABLE public.utm_links 
ADD COLUMN expansion_group_id uuid;

-- Add index for faster grouping queries
CREATE INDEX idx_utm_links_expansion_group ON public.utm_links(expansion_group_id) 
WHERE expansion_group_id IS NOT NULL;

-- Add index for grouping by campaign, platform, and date
CREATE INDEX idx_utm_links_grouping ON public.utm_links(utm_campaign, utm_source, created_at);