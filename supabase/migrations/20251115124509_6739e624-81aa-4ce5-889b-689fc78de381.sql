-- Create table for storing Google Sheets references
CREATE TABLE IF NOT EXISTS google_sheets_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sheet_id TEXT NOT NULL,
  sheet_url TEXT NOT NULL,
  sheet_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE google_sheets_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sheets"
  ON google_sheets_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sheets"
  ON google_sheets_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sheets"
  ON google_sheets_reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sheets"
  ON google_sheets_reports FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_google_sheets_user_id ON google_sheets_reports(user_id);

-- Updated at trigger
CREATE TRIGGER update_google_sheets_updated_at
  BEFORE UPDATE ON google_sheets_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();