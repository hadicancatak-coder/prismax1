-- ========================================
-- COMPREHENSIVE FIX: Database Migration
-- Part 1: Add columns and functions (skip enum for code handling)
-- ========================================

-- 1. Add tracking columns for external links management
ALTER TABLE campaign_external_access 
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ;

-- 2. Add auto_rescheduled_at column to tasks for overdue task tracking
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS auto_rescheduled_at TIMESTAMPTZ;

-- 3. Update reschedule_overdue_tasks function with enhanced logic
CREATE OR REPLACE FUNCTION reschedule_overdue_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  task_record RECORD;
  assignee_record RECORD;
  assignee_user_id UUID;
BEGIN
  -- Update overdue tasks: set due_at to today, priority to High, track reschedule timestamp
  UPDATE tasks
  SET 
    due_at = CURRENT_DATE,
    priority = 'High',
    auto_rescheduled_at = NOW(),
    updated_at = NOW()
  WHERE 
    due_at < CURRENT_DATE
    AND status NOT IN ('Completed', 'Failed', 'Blocked')
    AND is_recurring = false;
    
  -- Send notifications to all assignees of rescheduled tasks
  FOR task_record IN 
    SELECT t.id, t.title
    FROM tasks t
    WHERE t.auto_rescheduled_at IS NOT NULL 
    AND t.auto_rescheduled_at > NOW() - INTERVAL '1 minute'  -- Recently rescheduled
  LOOP
    -- Notify all assignees for this task
    FOR assignee_record IN 
      SELECT ta.user_id
      FROM task_assignees ta
      WHERE ta.task_id = task_record.id
    LOOP
      -- Get auth.users.id from profiles.id
      SELECT user_id INTO assignee_user_id 
      FROM profiles 
      WHERE id = assignee_record.user_id;
      
      IF assignee_user_id IS NOT NULL THEN
        -- Check if notification is enabled
        IF is_notification_enabled(assignee_user_id, 'task_overdue_rescheduled') THEN
          INSERT INTO notifications (user_id, type, payload_json)
          VALUES (
            assignee_user_id,
            'task_overdue_rescheduled',
            jsonb_build_object(
              'task_id', task_record.id,
              'task_title', task_record.title,
              'new_due_date', CURRENT_DATE,
              'priority', 'High'
            )
          );
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- 4. Create index on auto_rescheduled_at for performance
CREATE INDEX IF NOT EXISTS idx_tasks_auto_rescheduled_at ON tasks(auto_rescheduled_at) WHERE auto_rescheduled_at IS NOT NULL;