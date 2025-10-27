-- Add notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_at) WHERE due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences"
  ON notification_preferences
  FOR ALL
  USING (auth.uid() = user_id);

-- Function to check if notification is enabled for user
CREATE OR REPLACE FUNCTION is_notification_enabled(
  p_user_id UUID,
  p_notification_type TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (SELECT enabled FROM notification_preferences 
     WHERE user_id = p_user_id AND notification_type = p_notification_type),
    true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to send notification only if user has it enabled
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_type TEXT,
  p_payload_json JSONB
) RETURNS VOID AS $$
BEGIN
  IF is_notification_enabled(p_user_id, p_type) THEN
    INSERT INTO notifications (user_id, type, payload_json)
    VALUES (p_user_id, p_type, p_payload_json);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: Notify on task status change
CREATE OR REPLACE FUNCTION notify_task_status_change()
RETURNS TRIGGER AS $$
DECLARE
  assignee_record RECORD;
  assignee_user_id UUID;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    FOR assignee_record IN 
      SELECT ta.user_id
      FROM task_assignees ta
      WHERE ta.task_id = NEW.id
    LOOP
      SELECT user_id INTO assignee_user_id FROM profiles WHERE id = assignee_record.user_id;
      IF assignee_user_id IS NOT NULL THEN
        PERFORM send_notification(
          assignee_user_id,
          'task_status_changed',
          jsonb_build_object(
            'task_id', NEW.id,
            'task_title', NEW.title,
            'old_status', OLD.status,
            'new_status', NEW.status
          )
        );
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS task_status_change_trigger ON tasks;
CREATE TRIGGER task_status_change_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_status_change();

-- Trigger: Notify when blocker is resolved
CREATE OR REPLACE FUNCTION notify_blocker_resolved()
RETURNS TRIGGER AS $$
DECLARE
  assignee_record RECORD;
  assignee_user_id UUID;
BEGIN
  IF OLD.status = 'Blocked' AND NEW.status != 'Blocked' THEN
    FOR assignee_record IN 
      SELECT ta.user_id
      FROM task_assignees ta
      WHERE ta.task_id = NEW.id
    LOOP
      SELECT user_id INTO assignee_user_id FROM profiles WHERE id = assignee_record.user_id;
      IF assignee_user_id IS NOT NULL THEN
        PERFORM send_notification(
          assignee_user_id,
          'blocker_resolved',
          jsonb_build_object(
            'task_id', NEW.id,
            'task_title', NEW.title,
            'new_status', NEW.status
          )
        );
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS blocker_resolved_trigger ON tasks;
CREATE TRIGGER blocker_resolved_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_blocker_resolved();

-- Trigger: Notify campaign status changes
CREATE OR REPLACE FUNCTION notify_campaign_status_change()
RETURNS TRIGGER AS $$
DECLARE
  assignee_record RECORD;
  assignee_user_id UUID;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    FOR assignee_record IN 
      SELECT lca.user_id
      FROM launch_campaign_assignees lca
      WHERE lca.campaign_id = NEW.id
    LOOP
      SELECT user_id INTO assignee_user_id FROM profiles WHERE id = assignee_record.user_id;
      IF assignee_user_id IS NOT NULL THEN
        PERFORM send_notification(
          assignee_user_id,
          'campaign_status_changed',
          jsonb_build_object(
            'campaign_id', NEW.id,
            'campaign_title', NEW.title,
            'old_status', OLD.status,
            'new_status', NEW.status
          )
        );
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS campaign_status_change_trigger ON launch_pad_campaigns;
CREATE TRIGGER campaign_status_change_trigger
  AFTER UPDATE ON launch_pad_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION notify_campaign_status_change();