-- Create utm_lp_types table for landing page categorization
CREATE TABLE utm_lp_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  default_url_pattern text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE utm_lp_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for utm_lp_types
CREATE POLICY "LP types viewable by authenticated users" 
ON utm_lp_types FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage LP types" 
ON utm_lp_types FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add lp_type_id to utm_automation_rules
ALTER TABLE utm_automation_rules 
ADD COLUMN lp_type_id uuid REFERENCES utm_lp_types(id);

-- Add lp_type_id to utm_links
ALTER TABLE utm_links 
ADD COLUMN lp_type_id uuid REFERENCES utm_lp_types(id);

-- Insert default LP types
INSERT INTO utm_lp_types (name, description, display_order) VALUES
('Product Pages', 'Individual product landing pages', 1),
('Landing Pages', 'General marketing landing pages', 2),
('Webinars', 'Webinar registration and replay pages', 3),
('Registration Forms', 'Sign-up and registration pages', 4),
('Thank You Pages', 'Post-conversion thank you pages', 5),
('Event Pages', 'Event and conference pages', 6),
('Blog Posts', 'Blog content pages', 7),
('Resources', 'Downloadable resources and guides', 8);