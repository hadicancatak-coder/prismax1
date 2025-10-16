-- Track completed instances of recurring tasks
CREATE TABLE recurring_task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(task_id, completed_date)
);

ALTER TABLE recurring_task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view completions for their tasks"
  ON recurring_task_completions FOR SELECT
  USING (true);

CREATE POLICY "Users can mark instances complete"
  ON recurring_task_completions FOR INSERT
  WITH CHECK (auth.uid() = completed_by);