-- Create campaign_locations junction table for Location Intelligence
CREATE TABLE IF NOT EXISTS campaign_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES planned_campaigns(id) ON DELETE CASCADE,
  location_id UUID REFERENCES media_locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, location_id)
);

-- Enable RLS
ALTER TABLE campaign_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaign_locations
CREATE POLICY "Authenticated users can view campaign locations"
  ON campaign_locations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage campaign locations"
  ON campaign_locations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create website_campaigns junction table for Website Intel campaigns
CREATE TABLE IF NOT EXISTS website_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES planned_campaigns(id) ON DELETE CASCADE,
  website_id UUID REFERENCES web_intel_sites(id) ON DELETE CASCADE,
  platforms TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, website_id)
);

-- Enable RLS
ALTER TABLE website_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies for website_campaigns
CREATE POLICY "Authenticated users can view website campaigns"
  ON website_campaigns FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage website campaigns"
  ON website_campaigns FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create web_intel_deals table
CREATE TABLE IF NOT EXISTS web_intel_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Pending', 'Expired', 'Cancelled')),
  contract_link TEXT,
  contact_email TEXT,
  contact_name TEXT,
  website_id UUID REFERENCES web_intel_sites(id) ON DELETE SET NULL,
  notes TEXT,
  start_date DATE,
  end_date DATE,
  deal_value NUMERIC,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE web_intel_deals ENABLE ROW LEVEL SECURITY;

-- RLS policies for web_intel_deals
CREATE POLICY "Authenticated users can view deals"
  ON web_intel_deals FOR SELECT
  USING (true);

CREATE POLICY "Admins can create deals"
  ON web_intel_deals FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update deals"
  ON web_intel_deals FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete deals"
  ON web_intel_deals FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create deal_campaigns junction table
CREATE TABLE IF NOT EXISTS deal_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES web_intel_deals(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES planned_campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(deal_id, campaign_id)
);

-- Enable RLS
ALTER TABLE deal_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS policies for deal_campaigns
CREATE POLICY "Authenticated users can view deal campaigns"
  ON deal_campaigns FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage deal campaigns"
  ON deal_campaigns FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create deal_utm_links junction table
CREATE TABLE IF NOT EXISTS deal_utm_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES web_intel_deals(id) ON DELETE CASCADE,
  utm_link_id UUID REFERENCES utm_links(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(deal_id, utm_link_id)
);

-- Enable RLS
ALTER TABLE deal_utm_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for deal_utm_links
CREATE POLICY "Authenticated users can view deal UTM links"
  ON deal_utm_links FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage deal UTM links"
  ON deal_utm_links FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));