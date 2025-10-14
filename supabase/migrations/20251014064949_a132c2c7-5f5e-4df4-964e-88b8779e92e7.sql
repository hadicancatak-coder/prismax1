-- Create helper RPCs for QA testing

-- Add qa_tag column to relevant tables for easy cleanup
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS qa_tag boolean DEFAULT false;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS qa_tag boolean DEFAULT false;
ALTER TABLE launch_pad_campaigns ADD COLUMN IF NOT EXISTS qa_tag boolean DEFAULT false;

-- RPC: Seed test data (admin only)
CREATE OR REPLACE FUNCTION seed_qa_test_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  test_user_id uuid;
BEGIN
  -- Only allow admins
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Get first user for testing
  SELECT user_id INTO test_user_id FROM profiles LIMIT 1;

  -- Seed test tasks
  INSERT INTO tasks (title, status, priority, created_by, qa_tag)
  VALUES 
    ('QA Seed Task 1', 'Pending', 'High', test_user_id, true),
    ('QA Seed Task 2', 'In Progress', 'Medium', test_user_id, true),
    ('QA Seed Task 3', 'Done', 'Low', test_user_id, true);

  -- Seed test ads
  INSERT INTO ads (name, approval_status, headlines, descriptions, sitelinks, callouts, created_by, qa_tag)
  VALUES 
    ('QA Seed Ad 1', 'pending', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, test_user_id, true),
    ('QA Seed Ad 2', 'approved', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, test_user_id, true);

  -- Seed test campaigns
  INSERT INTO launch_pad_campaigns (title, teams, status, created_by, qa_tag)
  VALUES 
    ('QA Seed Campaign 1', ARRAY['Social UA'], 'pending', test_user_id, true),
    ('QA Seed Campaign 2', ARRAY['PPC'], 'live', test_user_id, true);

  result := jsonb_build_object(
    'success', true,
    'message', 'Test data seeded successfully'
  );

  RETURN result;
END;
$$;

-- RPC: Purge test data (admin only)
CREATE OR REPLACE FUNCTION purge_qa_test_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  deleted_count integer;
BEGIN
  -- Only allow admins
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Delete all QA-tagged data
  DELETE FROM tasks WHERE qa_tag = true;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  DELETE FROM ads WHERE qa_tag = true;
  DELETE FROM launch_pad_campaigns WHERE qa_tag = true;

  -- Clean up orphaned activity logs
  DELETE FROM activity_logs 
  WHERE entity_type IN ('task', 'ad', 'launch_campaign')
  AND entity_id NOT IN (
    SELECT id FROM tasks
    UNION
    SELECT id FROM ads
    UNION
    SELECT id FROM launch_pad_campaigns
  );

  result := jsonb_build_object(
    'success', true,
    'message', format('Purged %s test records', deleted_count)
  );

  RETURN result;
END;
$$;

-- RPC: Get foreign keys info (for schema validation)
CREATE OR REPLACE FUNCTION get_foreign_keys_info()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Only allow admins
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Return basic schema info
  SELECT jsonb_agg(
    jsonb_build_object(
      'table', tablename,
      'exists', true
    )
  ) INTO result
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN (
    'launch_campaign_assignees',
    'task_assignees',
    'project_assignees',
    'profiles'
  );

  RETURN result;
END;
$$;