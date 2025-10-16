-- Add display ad support columns to ads table
ALTER TABLE ads ADD COLUMN IF NOT EXISTS ad_type text DEFAULT 'search';
ALTER TABLE ads ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS long_headline text;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS short_headlines jsonb DEFAULT '[]'::jsonb;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS cta_text text;

-- Function to notify ad creator when approval status changes
CREATE OR REPLACE FUNCTION public.notify_ad_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  ad_creator_id uuid;
  recent_count integer;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    ad_creator_id := NEW.created_by;
    
    SELECT COUNT(*) INTO recent_count
    FROM notification_rate_limit
    WHERE user_id = ad_creator_id
      AND notification_type = 'ad_status_changed'
      AND created_at > now() - interval '5 minutes';
    
    IF recent_count < 10 AND ad_creator_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, payload_json)
      VALUES (
        ad_creator_id,
        'ad_status_changed',
        jsonb_build_object(
          'ad_id', NEW.id,
          'ad_name', NEW.name,
          'ad_type', NEW.ad_type,
          'old_status', OLD.approval_status,
          'new_status', NEW.approval_status,
          'changed_by', auth.uid()
        )
      );
      
      INSERT INTO notification_rate_limit (user_id, notification_type)
      VALUES (ad_creator_id, 'ad_status_changed')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_ad_status_changes
  AFTER UPDATE ON ads
  FOR EACH ROW
  EXECUTE FUNCTION notify_ad_status_change();

-- Function to notify admins when new ad is submitted for review
CREATE OR REPLACE FUNCTION public.notify_admins_new_ad()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_record RECORD;
  recent_count integer;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.approval_status = 'pending' THEN
    FOR admin_record IN
      SELECT user_id FROM user_roles WHERE role = 'admin'
    LOOP
      SELECT COUNT(*) INTO recent_count
      FROM notification_rate_limit
      WHERE user_id = admin_record.user_id
        AND notification_type = 'ad_pending_review'
        AND created_at > now() - interval '5 minutes';
      
      IF recent_count < 10 THEN
        INSERT INTO notifications (user_id, type, payload_json)
        VALUES (
          admin_record.user_id,
          'ad_pending_review',
          jsonb_build_object(
            'ad_id', NEW.id,
            'ad_name', NEW.name,
            'ad_type', NEW.ad_type,
            'created_by', NEW.created_by
          )
        );
        
        INSERT INTO notification_rate_limit (user_id, notification_type)
        VALUES (admin_record.user_id, 'ad_pending_review')
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_admins_on_ad_creation
  AFTER INSERT ON ads
  FOR EACH ROW
  EXECUTE FUNCTION notify_admins_new_ad();