-- Allow anonymous access for external campaign review
-- These policies enable external reviewers to view campaigns via review links

-- Allow anonymous users to read utm_campaigns
CREATE POLICY "Allow anonymous read for external review"
ON utm_campaigns FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read utm_campaign_versions
CREATE POLICY "Allow anonymous read campaign versions"
ON utm_campaign_versions FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to read campaign_entity_tracking
CREATE POLICY "Allow anonymous read entity tracking"
ON campaign_entity_tracking FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to insert external review comments
CREATE POLICY "Allow anonymous insert review comments"
ON external_campaign_review_comments FOR INSERT
TO anon
WITH CHECK (true);