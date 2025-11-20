-- Create table for UTM campaign version comments (internal users)
CREATE TABLE IF NOT EXISTS public.utm_campaign_version_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.utm_campaign_versions(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.utm_campaigns(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  author_email TEXT,
  comment_text TEXT NOT NULL,
  is_external BOOLEAN DEFAULT false,
  entity TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for external campaign review comments
CREATE TABLE IF NOT EXISTS public.external_campaign_review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.utm_campaigns(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.utm_campaign_versions(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT NOT NULL,
  entity TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  comment_type TEXT DEFAULT 'general' CHECK (comment_type IN ('general', 'lead_quality', 'version_feedback')),
  access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add campaign_id to campaign_external_access for direct campaign links
ALTER TABLE public.campaign_external_access 
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.utm_campaigns(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.utm_campaign_version_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_campaign_review_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for utm_campaign_version_comments
CREATE POLICY "Authenticated users can view version comments"
  ON public.utm_campaign_version_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create version comments"
  ON public.utm_campaign_version_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments"
  ON public.utm_campaign_version_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
  ON public.utm_campaign_version_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- RLS Policies for external_campaign_review_comments
CREATE POLICY "Public can view external comments"
  ON public.external_campaign_review_comments FOR SELECT
  USING (true);

CREATE POLICY "Public can create external comments"
  ON public.external_campaign_review_comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view all external comments"
  ON public.external_campaign_review_comments FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_version_comments_version ON public.utm_campaign_version_comments(version_id);
CREATE INDEX IF NOT EXISTS idx_version_comments_campaign ON public.utm_campaign_version_comments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_external_comments_campaign ON public.external_campaign_review_comments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_external_comments_version ON public.external_campaign_review_comments(version_id);
CREATE INDEX IF NOT EXISTS idx_external_access_campaign ON public.campaign_external_access(campaign_id);
CREATE INDEX IF NOT EXISTS idx_external_access_token ON public.campaign_external_access(access_token);