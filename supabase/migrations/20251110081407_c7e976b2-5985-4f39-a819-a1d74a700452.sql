-- Create saved_ads_library table for full ad templates
CREATE TABLE IF NOT EXISTS saved_ads_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  entity TEXT NOT NULL,
  campaign TEXT,
  ad_group TEXT,
  ad_type TEXT NOT NULL DEFAULT 'search',
  
  -- Ad content (JSON for flexibility)
  content JSONB NOT NULL,
  
  -- Metadata
  quality_score INTEGER,
  tags TEXT[],
  use_count INTEGER DEFAULT 0,
  is_template BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE saved_ads_library ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own saved ads"
  ON saved_ads_library
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved ads"
  ON saved_ads_library
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved ads"
  ON saved_ads_library
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved ads"
  ON saved_ads_library
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster filtering
CREATE INDEX idx_saved_ads_entity_campaign ON saved_ads_library(entity, campaign);
CREATE INDEX idx_saved_ads_user_type ON saved_ads_library(user_id, ad_type);

-- Update trigger
CREATE TRIGGER update_saved_ads_library_updated_at
  BEFORE UPDATE ON saved_ads_library
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();