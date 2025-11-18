-- Add unique constraint to prevent duplicate campaign-entity associations
ALTER TABLE campaign_entity_tracking 
ADD CONSTRAINT campaign_entity_tracking_campaign_entity_unique 
UNIQUE (campaign_id, entity);