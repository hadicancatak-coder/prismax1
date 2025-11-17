-- Fix the generate_recurring_tasks function to properly generate task instances
CREATE OR REPLACE FUNCTION public.generate_recurring_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  parent_task RECORD;
  new_date TIMESTAMPTZ;
  day_offset INT;
  existing_task_count INT;
  week_offset INT;
  assignee_record RECORD;
  new_task_id UUID;
BEGIN
  -- Loop through all recurring tasks (parent templates)
  FOR parent_task IN 
    SELECT * FROM tasks 
    WHERE recurrence_rrule IS NOT NULL
    AND recurrence_rrule != 'none'
    AND recurrence_rrule != ''
    AND parent_task_id IS NULL  -- Only process parent tasks
  LOOP
    
    -- Weekly recurrence with multiple days (e.g., FREQ=WEEKLY;BYDAY=SU,WE)
    IF parent_task.recurrence_rrule LIKE 'FREQ=WEEKLY%' 
       AND parent_task.recurrence_days_of_week IS NOT NULL THEN
      
      -- Generate instances for next 4 weeks
      FOR week_offset IN 0..3 LOOP
        FOR day_offset IN SELECT unnest(parent_task.recurrence_days_of_week) LOOP
          
          -- Calculate next occurrence for this day of week
          -- Start from current week + week_offset, then find the specific day
          new_date := date_trunc('week', CURRENT_DATE) + (week_offset * INTERVAL '7 days') + (day_offset * INTERVAL '1 day');
          
          -- Set time from parent task's due_at if available
          IF parent_task.due_at IS NOT NULL THEN
            new_date := new_date + (parent_task.due_at::time);
          END IF;
          
          -- Only generate future instances
          IF new_date >= CURRENT_DATE THEN
            
            -- Check if task already exists for this date (deduplication)
            SELECT COUNT(*) INTO existing_task_count
            FROM tasks
            WHERE parent_task_id = parent_task.id
            AND DATE(due_at) = DATE(new_date);
            
            IF existing_task_count = 0 THEN
              -- Create new recurring instance
              INSERT INTO tasks (
                title, description, priority, status, due_at,
                created_by, parent_task_id, task_type,
                entity, teams, visibility
              ) VALUES (
                parent_task.title,
                parent_task.description,
                parent_task.priority,
                'Pending',
                new_date,
                parent_task.created_by,
                parent_task.id,
                'recurring',
                parent_task.entity,
                parent_task.teams,
                parent_task.visibility
              ) RETURNING id INTO new_task_id;
              
              -- Copy assignees from parent task
              FOR assignee_record IN 
                SELECT user_id, assigned_by FROM task_assignees WHERE task_id = parent_task.id
              LOOP
                INSERT INTO task_assignees (task_id, user_id, assigned_by)
                VALUES (new_task_id, assignee_record.user_id, assignee_record.assigned_by)
                ON CONFLICT DO NOTHING;
              END LOOP;
              
            END IF;
          END IF;
        END LOOP;
      END LOOP;
      
    -- Monthly recurrence
    ELSIF parent_task.recurrence_rrule LIKE 'FREQ=MONTHLY%' 
          AND parent_task.recurrence_day_of_month IS NOT NULL THEN
      
      -- Generate instances for next 3 months
      FOR week_offset IN 0..2 LOOP
        new_date := (CURRENT_DATE + (week_offset * INTERVAL '1 month'))::TIMESTAMPTZ;
        new_date := DATE_TRUNC('month', new_date) + ((parent_task.recurrence_day_of_month - 1) * INTERVAL '1 day');
        
        -- Set time from parent task's due_at if available
        IF parent_task.due_at IS NOT NULL THEN
          new_date := new_date + (parent_task.due_at::time);
        END IF;
        
        -- Check if task already exists (deduplication)
        SELECT COUNT(*) INTO existing_task_count
        FROM tasks
        WHERE parent_task_id = parent_task.id
        AND DATE(due_at) = DATE(new_date);
        
        IF existing_task_count = 0 THEN
          INSERT INTO tasks (
            title, description, priority, status, due_at,
            created_by, parent_task_id, task_type,
            entity, teams, visibility
          ) VALUES (
            parent_task.title,
            parent_task.description,
            parent_task.priority,
            'Pending',
            new_date,
            parent_task.created_by,
            parent_task.id,
            'recurring',
            parent_task.entity,
            parent_task.teams,
            parent_task.visibility
          ) RETURNING id INTO new_task_id;
          
          -- Copy assignees
          FOR assignee_record IN 
            SELECT user_id, assigned_by FROM task_assignees WHERE task_id = parent_task.id
          LOOP
            INSERT INTO task_assignees (task_id, user_id, assigned_by)
            VALUES (new_task_id, assignee_record.user_id, assignee_record.assigned_by)
            ON CONFLICT DO NOTHING;
          END LOOP;
          
        END IF;
      END LOOP;
    END IF;
    
  END LOOP;
END;
$function$;