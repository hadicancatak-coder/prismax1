-- Add new columns to web_intel_deals for brand deals functionality
ALTER TABLE public.web_intel_deals 
ADD COLUMN IF NOT EXISTS app_name text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS website text;