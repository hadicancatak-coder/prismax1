-- Create recurring_task_completions table
CREATE TABLE IF NOT EXISTS recurring_task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_by UUID NOT NULL REFERENCES auth.users(id),
  completed_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, completed_date)
);

CREATE INDEX idx_recurring_completions_task ON recurring_task_completions(task_id);
CREATE INDEX idx_recurring_completions_date ON recurring_task_completions(completed_date);

-- Enable RLS
ALTER TABLE recurring_task_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view completions"
  ON recurring_task_completions FOR SELECT
  USING (true);

CREATE POLICY "Users can create completions"
  ON recurring_task_completions FOR INSERT
  WITH CHECK (auth.uid() = completed_by);

CREATE POLICY "Users can delete their own completions"
  ON recurring_task_completions FOR DELETE
  USING (auth.uid() = completed_by);