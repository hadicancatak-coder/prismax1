-- Create ad group versions table for version tracking
CREATE TABLE IF NOT EXISTS ad_group_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_group_id UUID REFERENCES ad_groups(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot_data JSONB NOT NULL,
  changed_fields TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create campaign versions table for version tracking
CREATE TABLE IF NOT EXISTS campaign_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot_data JSONB NOT NULL,
  changed_fields TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create entity_campaigns table to link entities to campaigns
CREATE TABLE IF NOT EXISTS entity_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity TEXT NOT NULL,
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity, campaign_id)
);

-- Enable RLS on new tables
ALTER TABLE ad_group_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ad_group_versions
CREATE POLICY "Ad group versions viewable by authenticated users"
  ON ad_group_versions FOR SELECT
  USING (true);

CREATE POLICY "Users can create ad group versions"
  ON ad_group_versions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- RLS Policies for campaign_versions
CREATE POLICY "Campaign versions viewable by authenticated users"
  ON campaign_versions FOR SELECT
  USING (true);

CREATE POLICY "Users can create campaign versions"
  ON campaign_versions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- RLS Policies for entity_campaigns
CREATE POLICY "Entity campaigns viewable by authenticated users"
  ON entity_campaigns FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage entity campaigns"
  ON entity_campaigns FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ad_group_versions_ad_group_id ON ad_group_versions(ad_group_id);
CREATE INDEX IF NOT EXISTS idx_campaign_versions_campaign_id ON campaign_versions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_entity_campaigns_entity ON entity_campaigns(entity);
CREATE INDEX IF NOT EXISTS idx_entity_campaigns_campaign_id ON entity_campaigns(campaign_id);