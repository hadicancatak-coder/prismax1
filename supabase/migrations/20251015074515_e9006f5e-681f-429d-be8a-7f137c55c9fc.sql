-- Create notification function for campaign assignments
CREATE OR REPLACE FUNCTION public.notify_campaign_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  recent_count integer;
  campaign_title text;
BEGIN
  -- Get campaign title
  SELECT title INTO campaign_title
  FROM launch_pad_campaigns
  WHERE id = NEW.campaign_id;
  
  -- Rate limiting: Check if user received more than 10 campaign assignments in last 5 minutes
  SELECT COUNT(*) INTO recent_count
  FROM notification_rate_limit
  WHERE user_id = NEW.user_id
    AND notification_type = 'campaign_assigned'
    AND created_at > now() - interval '5 minutes';
  
  IF recent_count < 10 THEN
    INSERT INTO notifications (user_id, type, payload_json)
    VALUES (
      NEW.user_id,
      'campaign_assigned',
      jsonb_build_object(
        'campaign_id', NEW.campaign_id,
        'campaign_title', campaign_title,
        'assigned_by', NEW.assigned_by
      )
    );
    
    -- Track this notification
    INSERT INTO notification_rate_limit (user_id, notification_type)
    VALUES (NEW.user_id, 'campaign_assigned')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for campaign assignment notifications
DROP TRIGGER IF EXISTS campaign_assignment_notification ON launch_campaign_assignees;
CREATE TRIGGER campaign_assignment_notification
AFTER INSERT ON launch_campaign_assignees
FOR EACH ROW
EXECUTE FUNCTION notify_campaign_assignment();