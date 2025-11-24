-- Allow anonymous users to verify tokens (SELECT) and update email verification
-- This enables external review links to work without authentication

-- Allow anonymous token verification
CREATE POLICY "Allow anonymous token verification"
ON public.campaign_external_access
FOR SELECT
TO anon
USING (
  is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
);

-- Allow anonymous email verification update
CREATE POLICY "Allow anonymous email verification"
ON public.campaign_external_access
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