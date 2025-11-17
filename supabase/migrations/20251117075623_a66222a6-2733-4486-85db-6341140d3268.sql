-- Add campaign_name column to landing_page_templates
ALTER TABLE landing_page_templates 
ADD COLUMN IF NOT EXISTS campaign_name text;