-- Add agency and pricing fields to media_locations
ALTER TABLE media_locations 
ADD COLUMN IF NOT EXISTS agency TEXT,
ADD COLUMN IF NOT EXISTS price_per_month NUMERIC;

-- Create planned_campaigns table
CREATE TABLE IF NOT EXISTS planned_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  budget NUMERIC NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  agency TEXT,
  cities TEXT[] NOT NULL,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on planned_campaigns
ALTER TABLE planned_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for planned_campaigns
CREATE POLICY "Campaigns viewable by authenticated users"
  ON planned_campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage campaigns"
  ON planned_campaigns FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create campaign_placements junction table
CREATE TABLE IF NOT EXISTS campaign_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES planned_campaigns(id) ON DELETE CASCADE,
  location_id UUID REFERENCES media_locations(id) ON DELETE CASCADE,
  allocated_budget NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on campaign_placements
ALTER TABLE campaign_placements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_placements
CREATE POLICY "Placements viewable by authenticated users"
  ON campaign_placements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage placements"
  ON campaign_placements FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updating updated_at on planned_campaigns
CREATE OR REPLACE FUNCTION update_planned_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_planned_campaigns_updated_at
  BEFORE UPDATE ON planned_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_planned_campaigns_updated_at();