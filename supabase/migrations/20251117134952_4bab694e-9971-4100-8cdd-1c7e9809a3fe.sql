-- PHASE 1: Fix Web Intel Deals Permissions
-- Drop admin-only policies
DROP POLICY IF EXISTS "Admins can create deals" ON web_intel_deals;
DROP POLICY IF EXISTS "Admins can update deals" ON web_intel_deals;
DROP POLICY IF EXISTS "Admins can delete deals" ON web_intel_deals;

-- Add authenticated user policies
CREATE POLICY "Authenticated users can create deals"
ON web_intel_deals FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update deals"
ON web_intel_deals FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete deals"
ON web_intel_deals FOR DELETE
TO authenticated
USING (true);

-- PHASE 2: Create Campaign Entity Tracking System
CREATE TABLE IF NOT EXISTS campaign_entity_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  entity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(campaign_id, entity)
);

-- Add RLS policies
ALTER TABLE campaign_entity_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tracking"
ON campaign_entity_tracking FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage tracking"
ON campaign_entity_tracking FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX idx_campaign_entity_tracking_entity ON campaign_entity_tracking(entity);
CREATE INDEX idx_campaign_entity_tracking_campaign ON campaign_entity_tracking(campaign_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_campaign_entity_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_entity_tracking_updated_at
BEFORE UPDATE ON campaign_entity_tracking
FOR EACH ROW
EXECUTE FUNCTION update_campaign_entity_tracking_updated_at();