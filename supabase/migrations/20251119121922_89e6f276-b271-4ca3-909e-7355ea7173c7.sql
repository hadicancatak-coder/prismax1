-- Remove all pricing, scoring, and impression-related columns from Location Intelligence

-- Drop unused columns from media_locations
ALTER TABLE public.media_locations 
  DROP COLUMN IF EXISTS manual_score,
  DROP COLUMN IF EXISTS price_per_month,
  DROP COLUMN IF EXISTS est_daily_traffic;

-- Drop budget tracking from planned campaigns
ALTER TABLE public.planned_campaigns 
  DROP COLUMN IF EXISTS budget;

-- Drop allocated budget from campaign placements
ALTER TABLE public.campaign_placements 
  DROP COLUMN IF EXISTS allocated_budget;