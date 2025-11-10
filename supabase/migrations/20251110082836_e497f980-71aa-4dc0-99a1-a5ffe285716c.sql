-- Add languages column to ad_campaigns
ALTER TABLE ad_campaigns 
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{EN}';

-- Add metadata columns to saved_ads_library for better organization
ALTER TABLE saved_ads_library
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS ad_group_id UUID REFERENCES ad_groups(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

-- Add index for faster queries on saved ads
CREATE INDEX IF NOT EXISTS idx_saved_ads_entity 
ON saved_ads_library(entity);

-- Create move/duplicate history tracking table
CREATE TABLE IF NOT EXISTS ad_move_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES ads(id) ON DELETE CASCADE,
  from_ad_group_id UUID,
  to_ad_group_id UUID,
  moved_by UUID REFERENCES auth.users(id),
  moved_at TIMESTAMPTZ DEFAULT NOW(),
  action_type TEXT NOT NULL CHECK (action_type IN ('move', 'duplicate'))
);

-- Enable RLS on ad_move_history
ALTER TABLE ad_move_history ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view move history
CREATE POLICY "Move history viewable by authenticated users"
ON ad_move_history FOR SELECT
TO authenticated
USING (true);

-- Users can create move history entries
CREATE POLICY "Users can create move history"
ON ad_move_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = moved_by);