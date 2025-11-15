-- Create search_content function for global search
CREATE OR REPLACE FUNCTION search_content(query_text TEXT, limit_results INT DEFAULT 20)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  description TEXT,
  url TEXT,
  entity_type TEXT,
  category TEXT,
  workspace_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  -- Search in Tasks
  SELECT 
    t.id::TEXT,
    t.title,
    COALESCE(t.description, '')::TEXT,
    '/tasks'::TEXT as url,
    'task'::TEXT as entity_type,
    'Tasks'::TEXT as category,
    NULL::TEXT as workspace_id
  FROM tasks t
  WHERE t.title ILIKE '%' || query_text || '%'
    OR t.description ILIKE '%' || query_text || '%'
  
  UNION ALL
  
  -- Search in UTM Links
  SELECT 
    u.id::TEXT,
    COALESCE(u.campaign, 'UTM Link')::TEXT as title,
    COALESCE(u.final_url, '')::TEXT as description,
    '/operations/utm-planner'::TEXT as url,
    'utm_link'::TEXT as entity_type,
    'Marketing'::TEXT as category,
    NULL::TEXT as workspace_id
  FROM utm_links u
  WHERE u.campaign ILIKE '%' || query_text || '%'
    OR u.final_url ILIKE '%' || query_text || '%'
    OR u.utm_source ILIKE '%' || query_text || '%'
  
  UNION ALL
  
  -- Search in Campaigns
  SELECT 
    c.id::TEXT,
    c.title,
    COALESCE(c.description, '')::TEXT,
    '/campaigns'::TEXT as url,
    'campaign'::TEXT as entity_type,
    'Marketing'::TEXT as category,
    NULL::TEXT as workspace_id
  FROM campaigns c
  WHERE c.title ILIKE '%' || query_text || '%'
    OR c.description ILIKE '%' || query_text || '%'
  
  UNION ALL
  
  -- Search in Custom Reports
  SELECT 
    r.id::TEXT,
    r.name as title,
    ''::TEXT as description,
    '/operations/custom-reports'::TEXT as url,
    'report'::TEXT as entity_type,
    'Reports'::TEXT as category,
    NULL::TEXT as workspace_id
  FROM custom_reports r
  WHERE r.name ILIKE '%' || query_text || '%'
  
  UNION ALL
  
  -- Search in Status Logs
  SELECT 
    s.id::TEXT,
    s.title,
    COALESCE(s.description, '')::TEXT,
    '/status-log'::TEXT as url,
    'status_log'::TEXT as entity_type,
    'Operations'::TEXT as category,
    NULL::TEXT as workspace_id
  FROM status_logs s
  WHERE s.title ILIKE '%' || query_text || '%'
    OR s.description ILIKE '%' || query_text || '%'
  
  UNION ALL
  
  -- Search in Media Locations
  SELECT 
    l.id::TEXT,
    l.name as title,
    COALESCE(l.city || ' - ' || l.type, '')::TEXT as description,
    '/location-intelligence'::TEXT as url,
    'location'::TEXT as entity_type,
    'Locations'::TEXT as category,
    NULL::TEXT as workspace_id
  FROM media_locations l
  WHERE l.name ILIKE '%' || query_text || '%'
    OR l.city ILIKE '%' || query_text || '%'
  
  UNION ALL
  
  -- Search in Ads
  SELECT 
    a.id::TEXT,
    a.name as title,
    COALESCE(a.campaign_name, '')::TEXT as description,
    '/search-planner'::TEXT as url,
    'ad'::TEXT as entity_type,
    'Marketing'::TEXT as category,
    NULL::TEXT as workspace_id
  FROM ads a
  WHERE a.name ILIKE '%' || query_text || '%'
    OR a.campaign_name ILIKE '%' || query_text || '%'
  
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;