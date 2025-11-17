-- Create UTM Automation Rules table
CREATE TABLE utm_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL CHECK (rule_name IN ('utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term')),
  rule_type TEXT NOT NULL DEFAULT 'template' CHECK (rule_type IN ('template', 'formula', 'conditional')),
  template TEXT,
  formula TEXT,
  conditions JSONB,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Index for faster lookups
CREATE INDEX idx_utm_rules_active ON utm_automation_rules(rule_name, is_active, priority DESC);
CREATE INDEX idx_utm_rules_created_by ON utm_automation_rules(created_by);

-- Enable RLS
ALTER TABLE utm_automation_rules ENABLE ROW LEVEL SECURITY;

-- Only admins can manage rules
CREATE POLICY "Admins can manage automation rules"
ON utm_automation_rules
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create rule execution log table for debugging
CREATE TABLE utm_rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES utm_automation_rules(id) ON DELETE CASCADE,
  input_context JSONB NOT NULL,
  output_value TEXT NOT NULL,
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT now()
);

-- Index for performance
CREATE INDEX idx_utm_executions_rule ON utm_rule_executions(rule_id, executed_at DESC);
CREATE INDEX idx_utm_executions_date ON utm_rule_executions(executed_at DESC);

-- Enable RLS
ALTER TABLE utm_rule_executions ENABLE ROW LEVEL SECURITY;

-- Admins can view execution logs
CREATE POLICY "Admins can view execution logs"
ON utm_rule_executions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert execution logs
CREATE POLICY "System can insert execution logs"
ON utm_rule_executions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_utm_automation_rules_updated_at
BEFORE UPDATE ON utm_automation_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();