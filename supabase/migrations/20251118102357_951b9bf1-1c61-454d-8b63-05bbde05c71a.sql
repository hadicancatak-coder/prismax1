-- Add entity column to campaign_external_access for entity-specific review links
ALTER TABLE campaign_external_access
ADD COLUMN entity TEXT;

-- Add request_type column to campaign_comments for external reviewer requests
ALTER TABLE campaign_comments
ADD COLUMN request_type TEXT DEFAULT 'Comment';

-- Add check constraint for valid request types
ALTER TABLE campaign_comments
ADD CONSTRAINT request_type_check 
CHECK (request_type IN ('Comment', 'Optimize', 'Boost', 'Remove'));

-- Add index for faster external access token lookups
CREATE INDEX idx_external_access_token 
ON campaign_external_access(access_token) 
WHERE is_active = true;

-- Add index for entity-based filtering
CREATE INDEX idx_external_access_entity
ON campaign_external_access(entity)
WHERE entity IS NOT NULL;