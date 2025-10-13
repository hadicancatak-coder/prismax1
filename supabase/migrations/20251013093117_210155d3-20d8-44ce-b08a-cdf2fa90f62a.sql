-- Create ads table for storing Google Ads
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  entity TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  headlines JSONB NOT NULL DEFAULT '[]'::jsonb,
  descriptions JSONB NOT NULL DEFAULT '[]'::jsonb,
  landing_page TEXT,
  sitelinks JSONB NOT NULL DEFAULT '[]'::jsonb,
  callouts JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Ads viewable by authenticated users"
  ON public.ads FOR SELECT
  USING (true);

CREATE POLICY "Users can create own ads"
  ON public.ads FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own ads"
  ON public.ads FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own ads"
  ON public.ads FOR DELETE
  USING (auth.uid() = created_by);

-- Admins can manage all ads
CREATE POLICY "Admins can manage all ads"
  ON public.ads FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_ads_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();