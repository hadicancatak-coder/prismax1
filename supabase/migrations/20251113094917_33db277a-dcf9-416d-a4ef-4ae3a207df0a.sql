-- Create status_logs table
CREATE TABLE status_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  title text NOT NULL,
  description text,
  log_type text NOT NULL CHECK (log_type IN ('issue', 'blocker', 'plan', 'update', 'note')),
  
  entity text[],
  platform text,
  campaign_name text,
  
  status text DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  
  task_id uuid REFERENCES tasks(id),
  converted_at timestamptz,
  converted_by uuid REFERENCES auth.users(id)
);

-- Indexes for filtering
CREATE INDEX idx_status_logs_entity ON status_logs USING GIN (entity);
CREATE INDEX idx_status_logs_platform ON status_logs(platform);
CREATE INDEX idx_status_logs_campaign ON status_logs(campaign_name);
CREATE INDEX idx_status_logs_status ON status_logs(status);
CREATE INDEX idx_status_logs_created_at ON status_logs(created_at DESC);

-- Enable RLS
ALTER TABLE status_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Status logs viewable by authenticated users"
  ON status_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create status logs"
  ON status_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own status logs"
  ON status_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can manage all status logs"
  ON status_logs FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Update utm_campaigns table with new fields
ALTER TABLE utm_campaigns
  ADD COLUMN IF NOT EXISTS campaign_type text CHECK (campaign_type IN ('Seminar', 'Webinar', 'Always On', 'Seasonal', 'Promo')),
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Create index for campaign ordering
CREATE INDEX IF NOT EXISTS idx_utm_campaigns_display_order ON utm_campaigns(display_order);

-- Update trigger for status_logs
CREATE TRIGGER update_status_logs_updated_at
  BEFORE UPDATE ON status_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();