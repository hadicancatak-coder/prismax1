-- Create enum for campaign types
CREATE TYPE campaign_type AS ENUM ('paid_search', 'social', 'email', 'display', 'affiliate', 'referral', 'organic');

-- Create enum for UTM link status
CREATE TYPE utm_status AS ENUM ('active', 'paused', 'archived');

-- Create utm_links table
CREATE TABLE public.utm_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  
  -- Core UTM Info
  name text NOT NULL,
  base_url text NOT NULL,
  full_url text NOT NULL,
  
  -- UTM Parameters (standard 5)
  utm_source text NOT NULL,
  utm_medium text NOT NULL,
  utm_campaign text NOT NULL,
  utm_term text,
  utm_content text,
  
  -- Custom parameters
  custom_params jsonb DEFAULT '{}',
  
  -- Metadata
  entity text[],
  teams text[],
  campaign_type campaign_type,
  status utm_status DEFAULT 'active',
  
  -- Usage & Validation
  is_validated boolean DEFAULT false,
  validation_notes text,
  validated_by uuid REFERENCES auth.users(id),
  validated_at timestamptz,
  
  usage_context text,
  tags text[],
  notes text,
  
  -- Tracking
  click_count integer DEFAULT 0,
  last_used_at timestamptz
);

-- Create utm_templates table
CREATE TABLE public.utm_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  
  name text NOT NULL,
  description text,
  
  -- Template parameters
  utm_source text NOT NULL,
  utm_medium text NOT NULL,
  utm_campaign text NOT NULL,
  utm_term text,
  utm_content text,
  
  entity text,
  team text,
  campaign_type campaign_type,
  is_public boolean DEFAULT false
);

-- Create utm_change_history table
CREATE TABLE public.utm_change_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  utm_link_id uuid NOT NULL REFERENCES utm_links(id) ON DELETE CASCADE,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid NOT NULL REFERENCES auth.users(id),
  
  field_changed text NOT NULL,
  old_value text,
  new_value text,
  change_reason text
);

-- Enable RLS
ALTER TABLE public.utm_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utm_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utm_change_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for utm_links
CREATE POLICY "UTM links viewable by authenticated users"
  ON public.utm_links FOR SELECT
  USING (true);

CREATE POLICY "Users can create own UTM links"
  ON public.utm_links FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own UTM links"
  ON public.utm_links FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can update any UTM link"
  ON public.utm_links FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own UTM links"
  ON public.utm_links FOR DELETE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete any UTM link"
  ON public.utm_links FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for utm_templates
CREATE POLICY "UTM templates viewable by authenticated users"
  ON public.utm_templates FOR SELECT
  USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Users can create own UTM templates"
  ON public.utm_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own UTM templates"
  ON public.utm_templates FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own UTM templates"
  ON public.utm_templates FOR DELETE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all UTM templates"
  ON public.utm_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for utm_change_history
CREATE POLICY "Change history viewable by authenticated users"
  ON public.utm_change_history FOR SELECT
  USING (true);

CREATE POLICY "System can insert change history"
  ON public.utm_change_history FOR INSERT
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_utm_links_updated_at
BEFORE UPDATE ON public.utm_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_utm_templates_updated_at
BEFORE UPDATE ON public.utm_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to track changes
CREATE OR REPLACE FUNCTION public.track_utm_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_by = auth.uid();
  
  IF TG_OP = 'UPDATE' THEN
    IF NEW.name IS DISTINCT FROM OLD.name THEN
      INSERT INTO utm_change_history (utm_link_id, changed_by, field_changed, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'name', OLD.name, NEW.name);
    END IF;
    IF NEW.utm_source IS DISTINCT FROM OLD.utm_source THEN
      INSERT INTO utm_change_history (utm_link_id, changed_by, field_changed, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'utm_source', OLD.utm_source, NEW.utm_source);
    END IF;
    IF NEW.utm_medium IS DISTINCT FROM OLD.utm_medium THEN
      INSERT INTO utm_change_history (utm_link_id, changed_by, field_changed, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'utm_medium', OLD.utm_medium, NEW.utm_medium);
    END IF;
    IF NEW.utm_campaign IS DISTINCT FROM OLD.utm_campaign THEN
      INSERT INTO utm_change_history (utm_link_id, changed_by, field_changed, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'utm_campaign', OLD.utm_campaign, NEW.utm_campaign);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_utm_link_changes
BEFORE UPDATE ON public.utm_links
FOR EACH ROW
EXECUTE FUNCTION public.track_utm_changes();