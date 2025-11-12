-- Add website_param to system_entities
ALTER TABLE system_entities 
ADD COLUMN IF NOT EXISTS website_param TEXT;

-- Update existing entities with default values based on their code
UPDATE system_entities 
SET website_param = LOWER(code)
WHERE website_param IS NULL;

-- Add utm_medium to utm_platforms
ALTER TABLE utm_platforms 
ADD COLUMN IF NOT EXISTS utm_medium TEXT;

-- Create utm_mediums table
CREATE TABLE IF NOT EXISTS utm_mediums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on utm_mediums
ALTER TABLE utm_mediums ENABLE ROW LEVEL SECURITY;

-- RLS policies for utm_mediums
CREATE POLICY "utm_mediums_viewable_by_authenticated" ON utm_mediums
  FOR SELECT USING (true);

CREATE POLICY "utm_mediums_admin_manage" ON utm_mediums
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Insert default UTM mediums
INSERT INTO utm_mediums (name, display_order) VALUES
  ('paid_social', 1),
  ('paid_search', 2),
  ('display', 3),
  ('referral', 4),
  ('pmax', 5)
ON CONFLICT (name) DO NOTHING;

-- Set default utm_medium values for existing platforms based on name
UPDATE utm_platforms SET utm_medium = 
  CASE 
    WHEN LOWER(name) LIKE '%facebook%' OR LOWER(name) LIKE '%meta%' 
         OR LOWER(name) LIKE '%instagram%' OR LOWER(name) LIKE '%tiktok%' 
         OR LOWER(name) LIKE '%snapchat%' OR LOWER(name) LIKE '%twitter%' 
         OR LOWER(name) LIKE '%linkedin%' OR LOWER(name) LIKE '%reddit%' THEN 'paid_social'
    WHEN LOWER(name) LIKE '%google%' OR LOWER(name) LIKE '%bing%' THEN 'paid_search'
    WHEN LOWER(name) LIKE '%display%' OR LOWER(name) LIKE '%gdn%' THEN 'display'
    WHEN LOWER(name) LIKE '%pmax%' THEN 'pmax'
    ELSE 'paid_social'
  END
WHERE utm_medium IS NULL;

-- Update RLS policies to allow DELETE for admins on system tables
DROP POLICY IF EXISTS "Admins can manage entities" ON system_entities;
CREATE POLICY "Admins can manage entities" ON system_entities
  FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage cities" ON seminar_cities;
CREATE POLICY "Admins can manage cities" ON seminar_cities
  FOR ALL USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage platforms" ON utm_platforms;
CREATE POLICY "Admins can manage platforms" ON utm_platforms
  FOR ALL USING (has_role(auth.uid(), 'admin'));