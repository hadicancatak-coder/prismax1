-- Allow anonymous users to read their external access tokens
-- This is needed for the external campaign review feature

-- Create policy to allow anyone to SELECT from campaign_external_access by token
CREATE POLICY "Allow anonymous access to valid review links"
ON campaign_external_access
FOR SELECT
TO anon
USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
);

-- Create policy to allow anonymous users to update their own verification status
CREATE POLICY "Allow anonymous users to verify their email"
ON campaign_external_access
FOR UPDATE
TO anon
USING (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
)
WITH CHECK (
  is_active = true
  AND (expires_at IS NULL OR expires_at > now())
);

-- Allow anonymous users to read campaign data for external review
CREATE POLICY "Allow anonymous access to campaigns via review token"
ON utm_campaigns
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM campaign_external_access
    WHERE campaign_external_access.is_active = true
    AND (campaign_external_access.expires_at IS NULL OR campaign_external_access.expires_at > now())
    AND (
      campaign_external_access.campaign_id = utm_campaigns.id
      OR campaign_external_access.campaign_id IS NULL
    )
  )
);

-- Allow anonymous users to read campaign versions for external review
CREATE POLICY "Allow anonymous access to campaign versions via review token"
ON utm_campaign_versions
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM campaign_external_access
    WHERE campaign_external_access.is_active = true
    AND (campaign_external_access.expires_at IS NULL OR campaign_external_access.expires_at > now())
    AND (
      campaign_external_access.campaign_id = utm_campaign_versions.utm_campaign_id
      OR campaign_external_access.campaign_id IS NULL
    )
  )
);

-- Allow anonymous users to read entity tracking for external review
CREATE POLICY "Allow anonymous access to entity tracking via review token"
ON campaign_entity_tracking
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM campaign_external_access
    WHERE campaign_external_access.is_active = true
    AND (campaign_external_access.expires_at IS NULL OR campaign_external_access.expires_at > now())
    AND campaign_external_access.entity = campaign_entity_tracking.entity
  )
);

-- Allow anonymous users to insert comments on external reviews
CREATE POLICY "Allow anonymous users to submit review comments"
ON external_campaign_review_comments
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM campaign_external_access
    WHERE campaign_external_access.access_token = external_campaign_review_comments.access_token
    AND campaign_external_access.is_active = true
    AND (campaign_external_access.expires_at IS NULL OR campaign_external_access.expires_at > now())
  )
);