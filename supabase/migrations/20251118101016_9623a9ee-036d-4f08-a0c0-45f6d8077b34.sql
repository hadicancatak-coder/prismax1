-- Create campaign_metadata table for versioning and images
CREATE TABLE IF NOT EXISTS campaign_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utm_campaign_id UUID REFERENCES utm_campaigns(id) ON DELETE CASCADE,
  version_code TEXT,
  image_url TEXT,
  image_file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(utm_campaign_id)
);

-- Create campaign_comments table for campaign-specific comments
CREATE TABLE IF NOT EXISTS campaign_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_tracking_id UUID REFERENCES campaign_entity_tracking(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  author_name TEXT,
  author_email TEXT,
  author_id UUID REFERENCES auth.users(id),
  is_external BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create campaign_external_access table for external review links
CREATE TABLE IF NOT EXISTS campaign_external_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT UNIQUE NOT NULL,
  reviewer_name TEXT,
  reviewer_email TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT email_domain_check CHECK (reviewer_email LIKE '%@cfi.trade')
);

-- Extend campaign_entity_tracking with entity-level comments
ALTER TABLE campaign_entity_tracking
ADD COLUMN IF NOT EXISTS entity_comments TEXT;

-- RLS Policies for campaign_metadata
ALTER TABLE campaign_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view campaign metadata" ON campaign_metadata;
CREATE POLICY "Users can view campaign metadata"
  ON campaign_metadata FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create campaign metadata" ON campaign_metadata;
CREATE POLICY "Users can create campaign metadata"
  ON campaign_metadata FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update campaign metadata" ON campaign_metadata;
CREATE POLICY "Users can update campaign metadata"
  ON campaign_metadata FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for campaign_comments
ALTER TABLE campaign_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view comments" ON campaign_comments;
CREATE POLICY "Authenticated users can view comments"
  ON campaign_comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Anonymous users can view comments" ON campaign_comments;
CREATE POLICY "Anonymous users can view comments"
  ON campaign_comments FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON campaign_comments;
CREATE POLICY "Users can create comments"
  ON campaign_comments FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- RLS Policies for campaign_external_access
ALTER TABLE campaign_external_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read access by token" ON campaign_external_access;
CREATE POLICY "Public can read access by token"
  ON campaign_external_access FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create external access" ON campaign_external_access;
CREATE POLICY "Users can create external access"
  ON campaign_external_access FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update external access" ON campaign_external_access;
CREATE POLICY "Users can update external access"
  ON campaign_external_access FOR UPDATE
  TO authenticated, anon
  USING (true);

-- Create storage bucket for campaign images (skip if exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-images', 'campaign-images', true)
ON CONFLICT (id) DO NOTHING;