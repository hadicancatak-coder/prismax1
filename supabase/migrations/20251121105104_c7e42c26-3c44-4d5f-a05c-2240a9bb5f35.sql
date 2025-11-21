-- Add public SELECT policy for utm_campaigns via external token
CREATE POLICY "Public can view campaigns via valid external token"
ON utm_campaigns
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM campaign_external_access
    WHERE is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (
        campaign_id = utm_campaigns.id 
        OR campaign_id IS NULL
      )
  )
);

-- Add public SELECT policy for utm_campaign_versions via external token
CREATE POLICY "Public can view versions via valid external token"
ON utm_campaign_versions
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM campaign_external_access
    WHERE is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (
        campaign_id = utm_campaign_versions.utm_campaign_id
        OR campaign_id IS NULL
      )
  )
);

-- Add public SELECT policy for campaign_entity_tracking via external token
CREATE POLICY "Public can view tracking via valid external token"
ON campaign_entity_tracking
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM campaign_external_access cea
    WHERE cea.is_active = true
      AND (cea.expires_at IS NULL OR cea.expires_at > now())
      AND cea.entity = campaign_entity_tracking.entity
  )
);