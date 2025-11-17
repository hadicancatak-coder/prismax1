-- Create compliance_requests table
CREATE TABLE public.compliance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'partial')),
  public_link_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex')
);

-- Create compliance_assets table
CREATE TABLE public.compliance_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.compliance_requests(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('text', 'image', 'video', 'link')),
  asset_content TEXT NOT NULL,
  asset_metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  version_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create compliance_reviews table
CREATE TABLE public.compliance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.compliance_requests(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.compliance_assets(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
  comments TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT
);

-- Enable RLS
ALTER TABLE public.compliance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for compliance_requests
CREATE POLICY "Users can view their own requests"
  ON public.compliance_requests FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can view all requests"
  ON public.compliance_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create requests"
  ON public.compliance_requests FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own requests"
  ON public.compliance_requests FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can update all requests"
  ON public.compliance_requests FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete their own requests"
  ON public.compliance_requests FOR DELETE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete all requests"
  ON public.compliance_requests FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for compliance_assets
CREATE POLICY "Users can view assets of their requests"
  ON public.compliance_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.compliance_requests
      WHERE id = compliance_assets.request_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can view all assets"
  ON public.compliance_assets FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view assets by token"
  ON public.compliance_assets FOR SELECT
  USING (true);

CREATE POLICY "Users can create assets for their requests"
  ON public.compliance_assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.compliance_requests
      WHERE id = compliance_assets.request_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can create all assets"
  ON public.compliance_assets FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update assets of their requests"
  ON public.compliance_assets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.compliance_requests
      WHERE id = compliance_assets.request_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can update all assets"
  ON public.compliance_assets FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete assets of their requests"
  ON public.compliance_assets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.compliance_requests
      WHERE id = compliance_assets.request_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can delete all assets"
  ON public.compliance_assets FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for compliance_reviews
CREATE POLICY "Users can view reviews of their requests"
  ON public.compliance_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.compliance_requests
      WHERE id = compliance_reviews.request_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can view all reviews"
  ON public.compliance_reviews FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view reviews by token"
  ON public.compliance_reviews FOR SELECT
  USING (true);

CREATE POLICY "Public can create reviews"
  ON public.compliance_reviews FOR INSERT
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_compliance_assets_request_id ON public.compliance_assets(request_id);
CREATE INDEX idx_compliance_reviews_request_id ON public.compliance_reviews(request_id);
CREATE INDEX idx_compliance_reviews_asset_id ON public.compliance_reviews(asset_id);
CREATE INDEX idx_compliance_requests_token ON public.compliance_requests(public_link_token);
CREATE INDEX idx_compliance_requests_created_by ON public.compliance_requests(created_by);

-- Create storage bucket for compliance assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'compliance-assets',
  'compliance-assets',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf']
);

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload compliance assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'compliance-assets' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Public can view compliance assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'compliance-assets');

CREATE POLICY "Users can update their compliance assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'compliance-assets'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their compliance assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'compliance-assets'
    AND auth.role() = 'authenticated'
  );

-- Trigger to update updated_at
CREATE TRIGGER update_compliance_requests_updated_at
  BEFORE UPDATE ON public.compliance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();