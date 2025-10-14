-- Create function to handle campaign launch task completion
CREATE OR REPLACE FUNCTION handle_campaign_launch_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only process if:
  -- 1. Task type is campaign_launch
  -- 2. Status changed to Completed
  -- 3. Task has a linked campaign_id
  IF NEW.task_type = 'campaign_launch' 
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
$$;

-- Create trigger on tasks table
DROP TRIGGER IF EXISTS on_campaign_task_completed ON tasks;
CREATE TRIGGER on_campaign_task_completed
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION handle_campaign_launch_completion();