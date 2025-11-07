-- Fix notify_team_members_on_task function to handle type mismatch
CREATE OR REPLACE FUNCTION public.notify_team_members_on_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
        WHERE team_name = ANY(p.teams::text[])  -- Cast team[] to text[] for proper comparison
      LOOP
        -- Insert notification
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
$function$;