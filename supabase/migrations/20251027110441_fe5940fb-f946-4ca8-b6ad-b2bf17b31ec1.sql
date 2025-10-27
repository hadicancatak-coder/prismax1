-- Add teams column to tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS teams JSONB DEFAULT '[]'::jsonb;

-- Create index for team-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_teams ON tasks USING GIN(teams);

-- Add language and platform columns to ad_elements
ALTER TABLE ad_elements
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'EN',
  ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'ppc';

-- Create indexes for language-based queries
CREATE INDEX IF NOT EXISTS idx_ad_elements_language ON ad_elements(language);
CREATE INDEX IF NOT EXISTS idx_ad_elements_platform ON ad_elements(platform);

-- Add language to ads table
ALTER TABLE ads
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'EN';

CREATE INDEX IF NOT EXISTS idx_ads_language ON ads(language);

-- Function to auto-detect language from content
CREATE OR REPLACE FUNCTION detect_language(content_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Simple heuristic: Check for Arabic characters
  IF content_text ~ '[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]' THEN
    RETURN 'AR';
  ELSE
    RETURN 'EN';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-set language when element is created/updated
CREATE OR REPLACE FUNCTION auto_detect_element_language()
RETURNS TRIGGER AS $$
DECLARE
  content_text TEXT;
BEGIN
  -- Extract text from content JSON
  content_text := COALESCE(
    NEW.content->>'text',
    NEW.content::TEXT
  );
  
  -- Auto-detect and set language
  NEW.language := detect_language(content_text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ad_element_language_detection ON ad_elements;
CREATE TRIGGER ad_element_language_detection
  BEFORE INSERT OR UPDATE ON ad_elements
  FOR EACH ROW
  EXECUTE FUNCTION auto_detect_element_language();

-- Trigger for ads table
CREATE OR REPLACE FUNCTION auto_detect_ad_language()
RETURNS TRIGGER AS $$
DECLARE
  sample_text TEXT;
BEGIN
  -- Check headlines first, then descriptions, then business name
  sample_text := COALESCE(
    NEW.headlines->0->>'text',
    NEW.descriptions->0->>'text',
    NEW.business_name,
    ''
  );
  
  NEW.language := detect_language(sample_text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ad_language_detection ON ads;
CREATE TRIGGER ad_language_detection
  BEFORE INSERT OR UPDATE ON ads
  FOR EACH ROW
  EXECUTE FUNCTION auto_detect_ad_language();

-- Function to get all users in specified teams
CREATE OR REPLACE FUNCTION get_users_in_teams(team_names TEXT[])
RETURNS TABLE(user_id UUID, profile_id UUID, name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.user_id, p.id as profile_id, p.name
  FROM profiles p
  WHERE p.teams && team_names;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: When teams are added to a task, notify all team members
CREATE OR REPLACE FUNCTION notify_team_members_on_task()
RETURNS TRIGGER AS $$
DECLARE
  team_member RECORD;
  team_name TEXT;
BEGIN
  -- Only process if teams changed
  IF (TG_OP = 'UPDATE' AND NEW.teams IS DISTINCT FROM OLD.teams) 
     OR (TG_OP = 'INSERT' AND NEW.teams IS NOT NULL AND jsonb_array_length(NEW.teams) > 0) THEN
    
    -- Loop through each team in the task
    FOR team_name IN 
      SELECT jsonb_array_elements_text(NEW.teams)
    LOOP
      -- Get all members of this team and notify them
      FOR team_member IN 
        SELECT p.user_id
        FROM profiles p
        WHERE p.teams @> ARRAY[team_name]::TEXT[]
      LOOP
        -- Insert notification directly (simplified approach)
        INSERT INTO notifications (user_id, type, content, link)
        VALUES (
          team_member.user_id,
          'task_team_assigned',
          jsonb_build_object(
            'task_id', NEW.id,
            'task_title', NEW.title,
            'team', team_name,
            'message', 'You have been assigned to a task via team ' || team_name
          ),
          '/tasks?id=' || NEW.id::text
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS task_team_assignment_trigger ON tasks;
CREATE TRIGGER task_team_assignment_trigger
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_team_members_on_task();