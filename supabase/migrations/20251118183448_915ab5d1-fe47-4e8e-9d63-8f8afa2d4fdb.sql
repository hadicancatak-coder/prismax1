-- 1. FIX CRITICAL: is_notification_enabled function
-- The function was incorrectly trying to access a 'preferences' column that doesn't exist
DROP FUNCTION IF EXISTS public.is_notification_enabled(uuid, text);

CREATE OR REPLACE FUNCTION public.is_notification_enabled(p_user_id uuid, p_notification_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_enabled boolean;
BEGIN
  -- Use the correct column structure: enabled, notification_type
  SELECT COALESCE(enabled, true) INTO is_enabled
  FROM public.notification_preferences
  WHERE user_id = p_user_id AND notification_type = p_notification_type;
  
  -- Default to true if no preference found
  RETURN COALESCE(is_enabled, true);
END;
$$;

-- 2. Create utm_campaign_comments table for campaign-level comments
CREATE TABLE IF NOT EXISTS public.utm_campaign_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utm_campaign_id UUID NOT NULL REFERENCES public.utm_campaigns(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  author_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on utm_campaign_comments
ALTER TABLE public.utm_campaign_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for utm_campaign_comments
CREATE POLICY "Authenticated users can view campaign comments"
  ON public.utm_campaign_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create campaign comments"
  ON public.utm_campaign_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id OR author_id IS NULL);

CREATE POLICY "Users can update their own comments"
  ON public.utm_campaign_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete any comment"
  ON public.utm_campaign_comments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add index for faster queries
CREATE INDEX idx_utm_campaign_comments_campaign_id ON public.utm_campaign_comments(utm_campaign_id);

-- 3. Add asset_link column to campaign_metadata
ALTER TABLE public.campaign_metadata
ADD COLUMN IF NOT EXISTS asset_link TEXT;

-- 4. Create utm_campaign_versions table for version history
CREATE TABLE IF NOT EXISTS public.utm_campaign_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utm_campaign_id UUID NOT NULL REFERENCES public.utm_campaigns(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  landing_page TEXT,
  description TEXT,
  image_url TEXT,
  image_file_size INTEGER,
  asset_link TEXT,
  version_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(utm_campaign_id, version_number)
);

-- Enable RLS on utm_campaign_versions
ALTER TABLE public.utm_campaign_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for utm_campaign_versions
CREATE POLICY "Authenticated users can view campaign versions"
  ON public.utm_campaign_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create campaign versions"
  ON public.utm_campaign_versions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Add indexes
CREATE INDEX idx_utm_campaign_versions_campaign_id ON public.utm_campaign_versions(utm_campaign_id);
CREATE INDEX idx_utm_campaign_versions_created_at ON public.utm_campaign_versions(created_at DESC);

COMMENT ON TABLE public.utm_campaign_comments IS 'Comments for UTM campaigns at the campaign level';
COMMENT ON TABLE public.utm_campaign_versions IS 'Version history for UTM campaigns including assets and metadata';