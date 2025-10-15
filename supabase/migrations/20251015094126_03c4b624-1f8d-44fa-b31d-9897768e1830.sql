-- Fix the notify_campaign_assignment function to use the correct user_id from profiles
CREATE OR REPLACE FUNCTION public.notify_campaign_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  recent_count integer;
  campaign_title text;
  target_user_id uuid;
BEGIN
  -- Get the actual auth user_id from the profiles table
  SELECT user_id INTO target_user_id
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- If no user found, skip notification
  IF target_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get campaign title
  SELECT title INTO campaign_title
  FROM launch_pad_campaigns
  WHERE id = NEW.campaign_id;
  
  -- Rate limiting: Check if user received more than 10 campaign assignments in last 5 minutes
  SELECT COUNT(*) INTO recent_count
  FROM notification_rate_limit
  WHERE user_id = target_user_id
    AND notification_type = 'campaign_assigned'
    AND created_at > now() - interval '5 minutes';
  
  IF recent_count < 10 THEN
    INSERT INTO notifications (user_id, type, payload_json)
    VALUES (
      target_user_id,
      'campaign_assigned',
      jsonb_build_object(
        'campaign_id', NEW.campaign_id,
        'campaign_title', campaign_title,
        'assigned_by', NEW.assigned_by
      )
    );
    
    -- Track this notification
    INSERT INTO notification_rate_limit (user_id, notification_type)
    VALUES (target_user_id, 'campaign_assigned')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;