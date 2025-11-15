-- Add multi-day recurring support and task type
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS recurrence_days_of_week integer[], 
ADD COLUMN IF NOT EXISTS task_type text DEFAULT 'general' CHECK (task_type IN ('general', 'recurring', 'campaign', 'operations'));

-- Create index for task type filtering
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks(task_type);

-- Create function to generate recurring task instances
CREATE OR REPLACE FUNCTION generate_recurring_tasks()
RETURNS void AS $$
DECLARE
  parent_task RECORD;
  new_date DATE;
  day_offset INT;
  existing_task_count INT;
BEGIN
  -- Loop through all recurring tasks
  FOR parent_task IN 
    SELECT * FROM tasks 
    WHERE recurrence_rrule != 'none' 
    AND recurrence_rrule IS NOT NULL
    AND (task_type = 'recurring' OR task_type IS NULL)
  LOOP
    -- Weekly recurrence with multiple days
    IF parent_task.recurrence_rrule = 'weekly' AND parent_task.recurrence_days_of_week IS NOT NULL THEN
      FOR day_offset IN SELECT unnest(parent_task.recurrence_days_of_week)
      LOOP
        -- Calculate next occurrence for this day of week
        new_date := parent_task.due_date + ((day_offset - EXTRACT(DOW FROM parent_task.due_date)::INT + 7) % 7);
        
        -- Check if task already exists for this date (deduplication)
        SELECT COUNT(*) INTO existing_task_count
        FROM tasks
        WHERE parent_task_id = parent_task.id
        AND due_date = new_date;
        
        IF existing_task_count = 0 THEN
          -- Create new recurring instance
          INSERT INTO tasks (
            title, description, priority, status, due_date,
            created_by, parent_task_id, recurrence_rrule, task_type,
            entity, teams
          ) VALUES (
            parent_task.title,
            parent_task.description,
            parent_task.priority,
            'Pending',
            new_date,
            parent_task.created_by,
            parent_task.id,
            parent_task.recurrence_rrule,
            'recurring',
            parent_task.entity,
            parent_task.teams
          );
        END IF;
      END LOOP;
    END IF;

    -- Monthly recurrence
    IF parent_task.recurrence_rrule = 'monthly' AND parent_task.recurrence_day_of_month IS NOT NULL THEN
      new_date := (parent_task.due_date + INTERVAL '1 month')::DATE;
      new_date := DATE_TRUNC('month', new_date) + (parent_task.recurrence_day_of_month - 1) * INTERVAL '1 day';
      
      -- Check if task already exists (deduplication)
      SELECT COUNT(*) INTO existing_task_count
      FROM tasks
      WHERE parent_task_id = parent_task.id
      AND due_date = new_date;
      
      IF existing_task_count = 0 THEN
        INSERT INTO tasks (
          title, description, priority, status, due_date,
          created_by, parent_task_id, recurrence_rrule, task_type,
          entity, teams
        ) VALUES (
          parent_task.title,
          parent_task.description,
          parent_task.priority,
          'Pending',
          new_date,
          parent_task.created_by,
          parent_task.id,
          parent_task.recurrence_rrule,
          'recurring',
          parent_task.entity,
          parent_task.teams
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add parent_task_id to track recurring task instances
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES tasks(id) ON DELETE CASCADE;