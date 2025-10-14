-- Add approval status to ads table
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending' CHECK (approval_status IN ('approved', 'not_approved', 'pending', 'needs_adjustments'));

-- Create ad comments table
CREATE TABLE IF NOT EXISTS public.ad_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.ad_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ad comments viewable by authenticated users"
ON public.ad_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create ad comments"
ON public.ad_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own ad comments"
ON public.ad_comments FOR UPDATE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete ad comments"
ON public.ad_comments FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Create launch pad campaigns table
CREATE TABLE IF NOT EXISTS public.launch_pad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  teams text[] NOT NULL DEFAULT '{}',
  creatives_link text,
  captions text,
  lp_url text,
  launch_month text,
  status text DEFAULT 'pending' CHECK (status IN ('live', 'pending', 'stopped')),
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid,
  launched_at timestamp with time zone
);

ALTER TABLE public.launch_pad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Launch campaigns viewable by authenticated users"
ON public.launch_pad_campaigns FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create launch campaigns"
ON public.launch_pad_campaigns FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can manage launch campaigns"
ON public.launch_pad_campaigns FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own launch campaigns"
ON public.launch_pad_campaigns FOR UPDATE TO authenticated USING (auth.uid() = created_by);

-- Create launch campaign assignees table
CREATE TABLE IF NOT EXISTS public.launch_campaign_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.launch_pad_campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  assigned_by uuid,
  assigned_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.launch_campaign_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Launch campaign assignees viewable by authenticated users"
ON public.launch_campaign_assignees FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can assign to launch campaigns"
ON public.launch_campaign_assignees FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can unassign from launch campaigns"
ON public.launch_campaign_assignees FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Add labels column to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS labels text[] DEFAULT '{}';

-- Add sprint column to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS sprint text;

-- Create trigger for launch campaign updates
CREATE TRIGGER update_launch_campaigns_updated_at
BEFORE UPDATE ON public.launch_pad_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Track launch campaign changes
CREATE OR REPLACE FUNCTION public.track_launch_campaign_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_by = auth.uid();
  
  IF TG_OP = 'UPDATE' THEN
    IF NEW.title IS DISTINCT FROM OLD.title THEN
      PERFORM log_activity(auth.uid(), 'updated', 'launch_campaign', NEW.id, 'title', OLD.title, NEW.title);
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      PERFORM log_activity(auth.uid(), 'updated', 'launch_campaign', NEW.id, 'status', OLD.status, NEW.status);
      IF NEW.status = 'live' AND OLD.status != 'live' THEN
        NEW.launched_at = now();
      END IF;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM log_activity(auth.uid(), 'created', 'launch_campaign', NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_launch_campaign_changes_trigger
BEFORE INSERT OR UPDATE ON public.launch_pad_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.track_launch_campaign_changes();

-- Track ad approval status changes
CREATE OR REPLACE FUNCTION public.track_ad_approval_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.approval_status IS DISTINCT FROM OLD.approval_status THEN
    PERFORM log_activity(
      auth.uid(), 
      'updated', 
      'ad', 
      NEW.id, 
      'approval_status', 
      OLD.approval_status, 
      NEW.approval_status
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_ad_approval_changes_trigger
BEFORE UPDATE ON public.ads
FOR EACH ROW
EXECUTE FUNCTION public.track_ad_approval_changes();