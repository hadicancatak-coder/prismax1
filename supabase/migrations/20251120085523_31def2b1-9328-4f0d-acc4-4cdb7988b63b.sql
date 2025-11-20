-- Create entity_ad_rules table for per-entity validation configuration
CREATE TABLE IF NOT EXISTS entity_ad_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL UNIQUE,
  prohibited_words text[] DEFAULT '{}',
  competitor_names text[] DEFAULT '{}',
  custom_validation_rules jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

-- Insert global default rules
INSERT INTO entity_ad_rules (entity, prohibited_words, competitor_names, is_active)
VALUES (
  'GLOBAL',
  ARRAY['#1', 'guaranteed profits', 'no risk', 'free money', 'get rich quick', 'best in the world'],
  ARRAY['competitor1', 'competitor2'],
  true
) ON CONFLICT (entity) DO NOTHING;

-- Enable RLS
ALTER TABLE entity_ad_rules ENABLE ROW LEVEL SECURITY;

-- Admins can manage all rules
CREATE POLICY "Admins can manage all ad rules"
ON entity_ad_rules FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view rules
CREATE POLICY "Authenticated users can view ad rules"
ON entity_ad_rules FOR SELECT
USING (auth.role() = 'authenticated');

-- Update RLS policies for external campaign access - allow public read with valid token
DROP POLICY IF EXISTS "Public can read access by token" ON campaign_external_access;
CREATE POLICY "Public can view via valid token"
ON campaign_external_access FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Allow public to update their email verification
DROP POLICY IF EXISTS "Users can update external access" ON campaign_external_access;
CREATE POLICY "Public can update email verification"
ON campaign_external_access FOR UPDATE
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Create external_campaign_review_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS external_campaign_review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES utm_campaigns(id) ON DELETE CASCADE,
  version_id uuid REFERENCES utm_campaign_versions(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  reviewer_email text NOT NULL,
  entity text NOT NULL,
  comment_text text NOT NULL,
  comment_type text DEFAULT 'version_feedback',
  access_token text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on comments
ALTER TABLE external_campaign_review_comments ENABLE ROW LEVEL SECURITY;

-- Public can insert comments with valid token
CREATE POLICY "Public can comment via valid token"
ON external_campaign_review_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM campaign_external_access
    WHERE access_token = external_campaign_review_comments.access_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  )
);

-- Public can view comments
CREATE POLICY "Public can view comments"
ON external_campaign_review_comments FOR SELECT
USING (true);

-- Authenticated users can view all comments
CREATE POLICY "Authenticated users can view all comments"
ON external_campaign_review_comments FOR SELECT
USING (auth.role() = 'authenticated');

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_entity_ad_rules_entity ON entity_ad_rules(entity);
CREATE INDEX IF NOT EXISTS idx_external_comments_campaign ON external_campaign_review_comments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_external_comments_token ON external_campaign_review_comments(access_token);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_entity_ad_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER entity_ad_rules_updated_at
BEFORE UPDATE ON entity_ad_rules
FOR EACH ROW
EXECUTE FUNCTION update_entity_ad_rules_updated_at();