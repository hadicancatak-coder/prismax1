-- Create web_intel_sites table
CREATE TABLE public.web_intel_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  country TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Website', 'App', 'Portal', 'Forum')),
  category TEXT,
  estimated_monthly_traffic BIGINT,
  entity TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create web_intel_historic_prices table
CREATE TABLE public.web_intel_historic_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.web_intel_sites(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create web_intel_past_campaigns table
CREATE TABLE public.web_intel_past_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.web_intel_sites(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  campaign_date DATE NOT NULL,
  budget NUMERIC NOT NULL,
  ctr NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.web_intel_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_intel_historic_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_intel_past_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for web_intel_sites
CREATE POLICY "Authenticated users can view sites"
  ON public.web_intel_sites FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create sites"
  ON public.web_intel_sites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update sites"
  ON public.web_intel_sites FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete sites"
  ON public.web_intel_sites FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for web_intel_historic_prices
CREATE POLICY "Authenticated users can view historic prices"
  ON public.web_intel_historic_prices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create historic prices"
  ON public.web_intel_historic_prices FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update historic prices"
  ON public.web_intel_historic_prices FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete historic prices"
  ON public.web_intel_historic_prices FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for web_intel_past_campaigns
CREATE POLICY "Authenticated users can view past campaigns"
  ON public.web_intel_past_campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create past campaigns"
  ON public.web_intel_past_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update past campaigns"
  ON public.web_intel_past_campaigns FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete past campaigns"
  ON public.web_intel_past_campaigns FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_web_intel_sites_country ON public.web_intel_sites(country);
CREATE INDEX idx_web_intel_sites_type ON public.web_intel_sites(type);
CREATE INDEX idx_web_intel_sites_category ON public.web_intel_sites(category);
CREATE INDEX idx_web_intel_sites_created_by ON public.web_intel_sites(created_by);
CREATE INDEX idx_web_intel_historic_prices_site_id ON public.web_intel_historic_prices(site_id);
CREATE INDEX idx_web_intel_past_campaigns_site_id ON public.web_intel_past_campaigns(site_id);

-- Create trigger for updated_at
CREATE TRIGGER update_web_intel_sites_updated_at
  BEFORE UPDATE ON public.web_intel_sites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();