-- Enable RLS on campaign_external_access if not already enabled
ALTER TABLE campaign_external_access ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them correctly)
DROP POLICY IF EXISTS "Allow anonymous access to valid review links" ON campaign_external_access;
DROP POLICY IF EXISTS "Allow anonymous users to verify their email" ON campaign_external_access;
DROP POLICY IF EXISTS "Allow anonymous access to campaigns via review token" ON utm_campaigns;
DROP POLICY IF EXISTS "Allow anonymous access to campaign versions via review token" ON utm_campaign_versions;
DROP POLICY IF EXISTS "Allow anonymous access to entity tracking via review token" ON campaign_entity_tracking;
DROP POLICY IF EXISTS "Allow anonymous users to submit review comments" ON external_campaign_review_comments;

-- Allow anonymous users to read external access tokens
CREATE POLICY "anon_select_valid_access_tokens"
ON campaign_external_access
FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
);

-- Allow anonymous users to update their verification status
CREATE POLICY "anon_update_email_verification"
ON campaign_external_access
FOR UPDATE
TO anon, authenticated
USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
)
WITH CHECK (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
);

-- Allow anyone with a valid token to read campaigns
CREATE POLICY "anon_select_campaigns_with_token"
ON utm_campaigns
FOR SELECT
TO anon, authenticated
USING (true);  -- We'll rely on application logic to verify token

-- Allow anyone to read campaign versions
CREATE POLICY "anon_select_campaign_versions"
ON utm_campaign_versions
FOR SELECT
TO anon, authenticated
USING (true);  -- Application logic verifies token

-- Allow anyone to read entity tracking
CREATE POLICY "anon_select_entity_tracking"
ON campaign_entity_tracking
FOR SELECT
TO anon, authenticated
USING (true);  -- Application logic verifies token

-- Allow anonymous users to insert comments
CREATE POLICY "anon_insert_review_comments"
ON external_campaign_review_comments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);  -- Application validates token before insert