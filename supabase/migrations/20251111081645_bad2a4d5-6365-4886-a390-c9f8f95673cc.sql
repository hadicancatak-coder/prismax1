-- Create enum for location types
CREATE TYPE public.location_type AS ENUM ('Billboard', 'LED Screen', 'Bus Shelter', 'Street Furniture', 'Transit', 'Other');

-- Create media_locations table
CREATE TABLE public.media_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  type public.location_type NOT NULL,
  latitude NUMERIC NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude NUMERIC NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  notes TEXT,
  manual_score INTEGER CHECK (manual_score >= 1 AND manual_score <= 10),
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create location_historic_prices table
CREATE TABLE public.location_historic_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.media_locations(id) ON DELETE CASCADE,
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  price NUMERIC NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(location_id, year)
);

-- Create location_past_campaigns table
CREATE TABLE public.location_past_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.media_locations(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  budget NUMERIC NOT NULL CHECK (budget >= 0),
  campaign_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_historic_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_past_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_locations
CREATE POLICY "Locations viewable by authenticated users"
  ON public.media_locations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert locations"
  ON public.media_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update locations"
  ON public.media_locations
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete locations"
  ON public.media_locations
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for location_historic_prices
CREATE POLICY "Historic prices viewable by authenticated users"
  ON public.location_historic_prices
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert historic prices"
  ON public.location_historic_prices
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update historic prices"
  ON public.location_historic_prices
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete historic prices"
  ON public.location_historic_prices
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for location_past_campaigns
CREATE POLICY "Past campaigns viewable by authenticated users"
  ON public.location_past_campaigns
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert past campaigns"
  ON public.location_past_campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update past campaigns"
  ON public.location_past_campaigns
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete past campaigns"
  ON public.location_past_campaigns
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for location images
INSERT INTO storage.buckets (id, name, public)
VALUES ('location_images', 'location_images', false);

-- Storage RLS policies
CREATE POLICY "Authenticated users can view location images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'location_images');

CREATE POLICY "Admins can upload location images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'location_images' AND
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update location images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'location_images' AND
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete location images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'location_images' AND
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Trigger for updated_at
CREATE TRIGGER update_media_locations_updated_at
  BEFORE UPDATE ON public.media_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_media_locations_city ON public.media_locations(city);
CREATE INDEX idx_media_locations_type ON public.media_locations(type);
CREATE INDEX idx_media_locations_score ON public.media_locations(manual_score);
CREATE INDEX idx_location_historic_prices_location ON public.location_historic_prices(location_id);
CREATE INDEX idx_location_past_campaigns_location ON public.location_past_campaigns(location_id);