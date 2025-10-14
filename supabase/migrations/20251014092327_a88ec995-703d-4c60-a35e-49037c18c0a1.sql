-- ============================================================================
-- PHASE 1: Critical Permission Fixes
-- ============================================================================

-- Drop conflicting profile SELECT policies
DROP POLICY IF EXISTS "Public profile data viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can view own complete profile" ON profiles;

-- Create unified profile SELECT policy
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Add admin override for profile updates (working days, etc.)
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- PHASE 2: Activity Log Enhancement - Comment Tracking
-- ============================================================================

-- Track task comments
CREATE OR REPLACE FUNCTION public.track_comment_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM log_activity(
    NEW.author_id,
    'commented',
    'task',
    NEW.task_id,
    'comment',
    NULL,
    substring(NEW.body, 1, 100),
    jsonb_build_object('comment_id', NEW.id)
  );
  RETURN NEW;
END;
$function$;

CREATE TRIGGER track_comment_changes
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION track_comment_activity();

-- Track ad comments
CREATE OR REPLACE FUNCTION public.track_ad_comment_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  PERFORM log_activity(
    NEW.author_id,
    'commented',
    'ad',
    NEW.ad_id,
    'comment',
    NULL,
    substring(NEW.body, 1, 100),
    jsonb_build_object('comment_id', NEW.id)
  );
  RETURN NEW;
END;
$function$;

CREATE TRIGGER track_ad_comment_changes
  AFTER INSERT ON ad_comments
  FOR EACH ROW
  EXECUTE FUNCTION track_ad_comment_activity();

-- ============================================================================
-- PHASE 4: Ads Planner - Campaign Hierarchy
-- ============================================================================

-- Ad Campaigns table
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  entity TEXT,
  objective TEXT,
  budget_monthly NUMERIC(10,2),
  status TEXT DEFAULT 'draft',
  google_campaign_id TEXT,
  google_campaign_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ad campaigns viewable by authenticated users"
  ON ad_campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create ad campaigns"
  ON ad_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all ad campaigns"
  ON ad_campaigns FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own ad campaigns"
  ON ad_campaigns FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Ad Groups table
CREATE TABLE IF NOT EXISTS public.ad_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  keywords JSONB DEFAULT '[]'::jsonb,
  match_types JSONB DEFAULT '[]'::jsonb,
  max_cpc NUMERIC(10,2),
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ad_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ad groups viewable by authenticated users"
  ON ad_groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create ad groups"
  ON ad_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage all ad groups"
  ON ad_groups FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own ad groups"
  ON ad_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Link ads to ad groups
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS ad_group_id UUID REFERENCES ad_groups(id) ON DELETE SET NULL;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS google_ad_id TEXT;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS date_launched TIMESTAMPTZ;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS date_paused TIMESTAMPTZ;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS ad_strength INTEGER;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS compliance_issues JSONB DEFAULT '[]'::jsonb;

-- ============================================================================
-- PHASE 7: Templates & Bulk Operations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ad_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  entity TEXT,
  headlines JSONB DEFAULT '[]'::jsonb,
  descriptions JSONB DEFAULT '[]'::jsonb,
  sitelinks JSONB DEFAULT '[]'::jsonb,
  callouts JSONB DEFAULT '[]'::jsonb,
  landing_page TEXT,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ad_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ad templates viewable by authenticated users"
  ON ad_templates FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Users can create ad templates"
  ON ad_templates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own ad templates"
  ON ad_templates FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all ad templates"
  ON ad_templates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- PHASE 8: Performance Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ad_performance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE NOT NULL,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr NUMERIC(5,2),
  cpc NUMERIC(10,2),
  conversions INTEGER DEFAULT 0,
  cost NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ad_performance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Performance snapshots viewable by authenticated users"
  ON ad_performance_snapshots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage performance snapshots"
  ON ad_performance_snapshots FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_created_by ON ad_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_ad_groups_campaign_id ON ad_groups(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ads_ad_group_id ON ads(ad_group_id);
CREATE INDEX IF NOT EXISTS idx_performance_ad_id ON ad_performance_snapshots(ad_id);
CREATE INDEX IF NOT EXISTS idx_performance_date ON ad_performance_snapshots(snapshot_date);