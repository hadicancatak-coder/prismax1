-- Add utm_content column to landing_page_templates
ALTER TABLE landing_page_templates
  ADD COLUMN utm_content text DEFAULT 'web' CHECK (utm_content IN ('web', 'mobile'));