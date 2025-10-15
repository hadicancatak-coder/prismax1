-- Backfill assignees for the 3 existing SocialUA campaigns
-- Campaign 1: Global Indices Campaign  
INSERT INTO launch_campaign_assignees (campaign_id, user_id, assigned_by)
SELECT 
  'b7f82eb5-dcb6-4906-8c2a-53f366370fc8'::uuid,
  p.id,
  (SELECT id FROM profiles WHERE user_id = '6496321c-9988-4e26-91d3-01e0243caa2c')
FROM profiles p
WHERE 'SocialUA' = ANY(p.teams)
  AND NOT EXISTS (
    SELECT 1 FROM launch_campaign_assignees 
    WHERE campaign_id = 'b7f82eb5-dcb6-4906-8c2a-53f366370fc8'::uuid 
    AND user_id = p.id
  );

-- Campaign 2: Qatar November Seminar
INSERT INTO launch_campaign_assignees (campaign_id, user_id, assigned_by)
SELECT 
  '60f89c1a-e21e-4ab4-9e14-9766794ca37e'::uuid,
  p.id,
  (SELECT id FROM profiles WHERE user_id = '6496321c-9988-4e26-91d3-01e0243caa2c')
FROM profiles p
WHERE 'SocialUA' = ANY(p.teams)
  AND NOT EXISTS (
    SELECT 1 FROM launch_campaign_assignees 
    WHERE campaign_id = '60f89c1a-e21e-4ab4-9e14-9766794ca37e'::uuid 
    AND user_id = p.id
  );

-- Campaign 3: Seasonal Camp, October Effect Campaign
INSERT INTO launch_campaign_assignees (campaign_id, user_id, assigned_by)
SELECT 
  'e35eb62f-03e5-4872-9b0e-7d8cdda5ee9b'::uuid,
  p.id,
  (SELECT id FROM profiles WHERE user_id = '6496321c-9988-4e26-91d3-01e0243caa2c')
FROM profiles p
WHERE 'SocialUA' = ANY(p.teams)
  AND NOT EXISTS (
    SELECT 1 FROM launch_campaign_assignees 
    WHERE campaign_id = 'e35eb62f-03e5-4872-9b0e-7d8cdda5ee9b'::uuid 
    AND user_id = p.id
  );