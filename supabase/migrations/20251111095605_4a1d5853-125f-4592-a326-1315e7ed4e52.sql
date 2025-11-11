-- Add estimated daily traffic column to media_locations
ALTER TABLE media_locations
ADD COLUMN est_daily_traffic INTEGER;

COMMENT ON COLUMN media_locations.est_daily_traffic IS 'Estimated daily traffic/impressions for this location';