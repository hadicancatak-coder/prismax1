-- Drop language field and utm_languages table
ALTER TABLE utm_links DROP COLUMN IF EXISTS language;
DROP TABLE IF EXISTS utm_languages CASCADE;

-- Add lp_type and dynamic_language to utm_links
ALTER TABLE utm_links 
  ADD COLUMN lp_type text CHECK (lp_type IN ('static', 'mauritius', 'dynamic')),
  ADD COLUMN dynamic_language text CHECK (dynamic_language IN ('EN', 'AR'));

-- Update utm_campaigns with landing page and usage tracking
ALTER TABLE utm_campaigns
  ADD COLUMN landing_page text,
  ADD COLUMN usage_count integer DEFAULT 0,
  ADD COLUMN last_used_at timestamptz;

-- Create indexes for better performance
CREATE INDEX idx_utm_campaigns_last_used ON utm_campaigns(last_used_at DESC NULLS LAST);
CREATE INDEX idx_utm_campaigns_usage_count ON utm_campaigns(usage_count DESC);
CREATE INDEX idx_utm_links_lp_type ON utm_links(lp_type);

-- Migrate existing data: detect lp_type from base_url
UPDATE utm_links 
SET lp_type = CASE
  WHEN base_url ~ '/(jo|lb|mu|vn|iq|az|uae|kw|om|uk|cy|vu|ps|za)/' THEN 'static'
  WHEN base_url ~ '/(en|ar|es|fr|de|it|pt|ru|zh|ja|ko|vi|th|id|ms|tr|fa|ur|hi|bn|pa|ta|te|ml|kn|gu|mr|or|as|ne|si|my|km|lo|tl|sw|am|ha|yo|ig|zu|xh|st|tn|ss|nr|ve|ts|af)/' THEN 'mauritius'
  ELSE 'dynamic'
END
WHERE lp_type IS NULL;

-- Update utm_campaigns usage tracking from existing links
UPDATE utm_campaigns c
SET 
  usage_count = (SELECT COUNT(*) FROM utm_links WHERE campaign_name = c.name),
  last_used_at = (SELECT MAX(created_at) FROM utm_links WHERE campaign_name = c.name);