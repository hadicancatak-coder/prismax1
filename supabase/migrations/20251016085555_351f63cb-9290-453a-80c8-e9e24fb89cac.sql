-- Add missing tables that didn't get created

-- Create ad_elements table (was missing)
CREATE TABLE IF NOT EXISTS ad_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  element_type TEXT NOT NULL CHECK (element_type IN ('headline', 'description', 'sitelink', 'callout')),
  content JSONB NOT NULL,
  entity TEXT[] DEFAULT '{}',
  google_status TEXT DEFAULT 'pending' CHECK (google_status IN ('pending', 'approved', 'limited', 'rejected')),
  google_status_date TIMESTAMPTZ,
  google_status_notes TEXT,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_elements_type ON ad_elements(element_type);
CREATE INDEX IF NOT EXISTS idx_ad_elements_entity ON ad_elements USING GIN(entity);
CREATE INDEX IF NOT EXISTS idx_ad_elements_status ON ad_elements(google_status);
CREATE INDEX IF NOT EXISTS idx_ad_elements_created_by ON ad_elements(created_by);

ALTER TABLE ad_elements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all elements" ON ad_elements;
CREATE POLICY "Users can view all elements"
  ON ad_elements FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users can create own elements" ON ad_elements;
CREATE POLICY "Users can create own elements"
  ON ad_elements FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update own elements" ON ad_elements;
CREATE POLICY "Users can update own elements"
  ON ad_elements FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete own elements" ON ad_elements;
CREATE POLICY "Users can delete own elements"
  ON ad_elements FOR DELETE USING (auth.uid() = created_by);

-- Create ad_versions table (was missing)
CREATE TABLE IF NOT EXISTS ad_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  snapshot_data JSONB NOT NULL,
  changed_fields TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_ad_versions_ad_id ON ad_versions(ad_id);

-- Add missing display ad columns to ad_templates
ALTER TABLE ad_templates ADD COLUMN IF NOT EXISTS ad_type TEXT DEFAULT 'search' CHECK (ad_type IN ('search', 'display'));
ALTER TABLE ad_templates ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE ad_templates ADD COLUMN IF NOT EXISTS long_headline TEXT;
ALTER TABLE ad_templates ADD COLUMN IF NOT EXISTS cta_text TEXT;