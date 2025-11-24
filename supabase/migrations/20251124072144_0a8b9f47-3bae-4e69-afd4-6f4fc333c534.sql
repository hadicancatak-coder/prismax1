-- Fix: Drop existing policy and recreate
DROP POLICY IF EXISTS "Authenticated users can view all external comments" ON external_campaign_review_comments;

-- Phase 2: Add updated_at to campaign_external_access (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaign_external_access' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE campaign_external_access ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to campaign_external_access
DROP TRIGGER IF EXISTS update_campaign_external_access_updated_at ON campaign_external_access;
CREATE TRIGGER update_campaign_external_access_updated_at 
BEFORE UPDATE ON campaign_external_access 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recreate the authenticated users policy
CREATE POLICY "Authenticated users can view all external comments"
ON external_campaign_review_comments
FOR SELECT
TO authenticated
USING (true);