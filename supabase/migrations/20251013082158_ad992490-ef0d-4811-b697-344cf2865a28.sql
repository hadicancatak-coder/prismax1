-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  entity TEXT,
  target TEXT NOT NULL CHECK (target IN ('Awareness', 'Conversions', 'Remarketing')),
  lp_link TEXT,
  image_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns
CREATE POLICY "Campaigns viewable by authenticated users"
  ON public.campaigns
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage campaigns"
  ON public.campaigns
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for campaign images
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaigns', 'campaigns', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for campaign images
CREATE POLICY "Campaign images are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'campaigns');

CREATE POLICY "Admins can upload campaign images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'campaigns' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update campaign images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'campaigns' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete campaign images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'campaigns' AND has_role(auth.uid(), 'admin'::app_role));