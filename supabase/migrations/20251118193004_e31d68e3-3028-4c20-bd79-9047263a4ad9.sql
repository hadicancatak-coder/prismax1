-- Update deal_campaigns to reference utm_campaigns instead of planned_campaigns
-- First, drop the existing foreign key constraint
ALTER TABLE deal_campaigns 
DROP CONSTRAINT IF EXISTS deal_campaigns_campaign_id_fkey;

-- Add new foreign key constraint to utm_campaigns
ALTER TABLE deal_campaigns 
ADD CONSTRAINT deal_campaigns_campaign_id_fkey 
FOREIGN KEY (campaign_id) REFERENCES utm_campaigns(id) ON DELETE CASCADE;