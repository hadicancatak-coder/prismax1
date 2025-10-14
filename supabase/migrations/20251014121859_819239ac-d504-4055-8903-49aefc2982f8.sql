-- Add entity column for countries
ALTER TABLE launch_pad_campaigns 
ADD COLUMN IF NOT EXISTS entity text[] DEFAULT '{}';

-- Add launch_date for proper date tracking
ALTER TABLE launch_pad_campaigns 
ADD COLUMN IF NOT EXISTS launch_date timestamptz;

-- Add description field
ALTER TABLE launch_pad_campaigns
ADD COLUMN IF NOT EXISTS description text;

-- Migrate existing launch_month data to launch_date (best effort)
UPDATE launch_pad_campaigns 
SET launch_date = (launch_month || '-01')::date
WHERE launch_month IS NOT NULL 
  AND launch_date IS NULL
  AND launch_month ~ '^\d{4}-\d{2}$';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_launch_campaigns_status ON launch_pad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_launch_campaigns_teams ON launch_pad_campaigns USING GIN(teams);
CREATE INDEX IF NOT EXISTS idx_launch_campaigns_entity ON launch_pad_campaigns USING GIN(entity);
CREATE INDEX IF NOT EXISTS idx_launch_campaigns_launch_date ON launch_pad_campaigns(launch_date);