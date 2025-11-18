-- Fix handle_campaign_launch_completion to use valid task_type
CREATE OR REPLACE FUNCTION public.handle_campaign_launch_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only process if:
  -- 1. Task type is campaign
  -- 2. Status changed to Completed
  -- 3. Task has a linked campaign_id
  IF NEW.task_type = 'campaign'  -- Changed from 'campaign_launch' to 'campaign'
     AND NEW.status = 'Completed' 
     AND OLD.status IS DISTINCT FROM 'Completed'
     AND NEW.campaign_id IS NOT NULL THEN
    
    -- Update the launch pad campaign to "orbit" status
    UPDATE launch_pad_campaigns
    SET 
      status = 'orbit',
      updated_at = now(),
      updated_by = auth.uid()
    WHERE id = NEW.campaign_id;
    
    -- Log the activity
    PERFORM log_activity(
      auth.uid(),
      'completed',
      'launch_campaign',
      NEW.campaign_id,
      'status',
      'live',
      'orbit',
      jsonb_build_object('task_id', NEW.id, 'task_title', NEW.title)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;