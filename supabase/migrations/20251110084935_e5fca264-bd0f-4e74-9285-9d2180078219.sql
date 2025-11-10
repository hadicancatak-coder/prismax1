-- Add template flags to campaigns and ad groups
ALTER TABLE ad_campaigns 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS template_name TEXT;

ALTER TABLE ad_groups 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS template_name TEXT;

-- Add approval and score fields to saved_ads_library
ALTER TABLE saved_ads_library
ADD COLUMN IF NOT EXISTS google_approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
ADD COLUMN IF NOT EXISTS compliance_score INTEGER CHECK (compliance_score >= 1 AND compliance_score <= 10);

-- Create unified view for saved elements
CREATE OR REPLACE VIEW saved_elements_unified AS
SELECT 
  'campaign' as element_type,
  id,
  name,
  entity,
  NULL::UUID as campaign_id,
  NULL::UUID as ad_group_id,
  'N/A' as approval_status,
  created_at
FROM ad_campaigns
WHERE is_template = true

UNION ALL

SELECT 
  'ad_group' as element_type,
  id,
  name,
  NULL as entity,
  campaign_id,
  NULL::UUID as ad_group_id,
  status as approval_status,
  created_at
FROM ad_groups
WHERE is_template = true

UNION ALL

SELECT 
  'ad' as element_type,
  id,
  name,
  entity,
  campaign_id,
  ad_group_id,
  google_approval_status as approval_status,
  created_at
FROM saved_ads_library;