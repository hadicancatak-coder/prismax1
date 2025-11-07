-- Add campaign grouping fields to ads table
ALTER TABLE public.ads 
ADD COLUMN IF NOT EXISTS campaign_name TEXT,
ADD COLUMN IF NOT EXISTS ad_group_name TEXT;

-- Create indexes for ads table
CREATE INDEX IF NOT EXISTS idx_ads_campaign_name ON public.ads(campaign_name) WHERE campaign_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ads_ad_group_name ON public.ads(ad_group_name) WHERE ad_group_name IS NOT NULL;

-- Drop existing approval_history table if it exists
DROP TABLE IF EXISTS public.approval_history CASCADE;

-- Create approval history table for multi-stage workflow
CREATE TABLE public.approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('copywriter', 'team_lead', 'legal', 'final')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')),
  approver_id UUID REFERENCES auth.users(id),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on approval_history
ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;

-- Approval history policies
CREATE POLICY "Approval history viewable by authenticated users"
  ON public.approval_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create approval history entries"
  ON public.approval_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = approver_id);

CREATE POLICY "Admins can manage approval history"
  ON public.approval_history FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for approval history
CREATE INDEX idx_approval_history_ad_id ON public.approval_history(ad_id);
CREATE INDEX idx_approval_history_stage_status ON public.approval_history(stage, status);