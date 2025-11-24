-- Allow anonymous users to read their own external access records (for token verification)
CREATE POLICY "Allow anonymous read external access by token"
ON campaign_external_access FOR SELECT
TO anon
USING (true);