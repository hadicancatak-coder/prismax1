-- Backfill utm_medium for existing platforms using calculateUtmMedium logic
UPDATE utm_platforms 
SET utm_medium = CASE
  WHEN LOWER(name) IN ('search', 'google', 'bing') THEN 'paid_search'
  WHEN LOWER(name) = 'pmax' THEN 'cross-network'
  WHEN LOWER(name) = 'youtube' THEN 'paid_video'
  WHEN LOWER(name) IN ('whatsapp', 'telegram') THEN 'messaging'
  WHEN LOWER(name) = 'dgen' THEN 'display'
  WHEN LOWER(name) IN ('display', 'discovery') THEN 'display'
  WHEN LOWER(name) IN ('facebook', 'instagram', 'fb', 'ig', 'snap', 'tiktok', 'reddit', 'x', 'linkedin') THEN 'paid_social'
  ELSE 'referral'
END
WHERE utm_medium IS NULL OR utm_medium = '';

-- Make utm_medium required going forward
ALTER TABLE utm_platforms 
ALTER COLUMN utm_medium SET NOT NULL;