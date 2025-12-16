-- STEP 1: Rename ad_campaigns to search_campaigns
ALTER TABLE public.ad_campaigns RENAME TO search_campaigns;

-- STEP 2: Update foreign key references in ad_groups
ALTER TABLE public.ad_groups 
  DROP CONSTRAINT IF EXISTS ad_groups_campaign_id_fkey;

ALTER TABLE public.ad_groups
  ADD CONSTRAINT ad_groups_campaign_id_fkey 
  FOREIGN KEY (campaign_id) 
  REFERENCES public.search_campaigns(id) 
  ON DELETE CASCADE;

-- STEP 3: Update foreign key references in entity_campaigns
ALTER TABLE public.entity_campaigns 
  DROP CONSTRAINT IF EXISTS entity_campaigns_campaign_id_fkey;

ALTER TABLE public.entity_campaigns
  ADD CONSTRAINT entity_campaigns_campaign_id_fkey 
  FOREIGN KEY (campaign_id) 
  REFERENCES public.search_campaigns(id) 
  ON DELETE CASCADE;

-- STEP 4: Update foreign key references in campaign_versions
ALTER TABLE public.campaign_versions 
  DROP CONSTRAINT IF EXISTS campaign_versions_campaign_id_fkey;

ALTER TABLE public.campaign_versions
  ADD CONSTRAINT campaign_versions_campaign_id_fkey 
  FOREIGN KEY (campaign_id) 
  REFERENCES public.search_campaigns(id) 
  ON DELETE CASCADE;

-- STEP 5: Drop orphan tables (if they exist)
-- First drop dependent tables/constraints
DROP TABLE IF EXISTS public.launch_campaign_assignees CASCADE;
DROP TABLE IF EXISTS public.launch_pad_campaigns CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;