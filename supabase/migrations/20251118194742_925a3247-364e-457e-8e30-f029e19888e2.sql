-- Drop the old foreign key constraint
ALTER TABLE campaign_entity_tracking 
DROP CONSTRAINT IF EXISTS campaign_entity_tracking_campaign_id_fkey;

-- Delete orphaned records that don't have a matching utm_campaign
DELETE FROM campaign_entity_tracking
WHERE campaign_id NOT IN (SELECT id FROM utm_campaigns);

-- Add the correct foreign key constraint pointing to utm_campaigns
ALTER TABLE campaign_entity_tracking 
ADD CONSTRAINT campaign_entity_tracking_campaign_id_fkey 
FOREIGN KEY (campaign_id) 
REFERENCES utm_campaigns(id) 
ON DELETE CASCADE;