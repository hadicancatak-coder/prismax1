-- Analytics Platform: Data Sources, Visualizations, and Dashboards

-- Store imported datasets
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN ('csv_upload', 'google_sheets', 'manual')),
  google_sheet_id TEXT,
  google_sheet_url TEXT,
  last_synced_at TIMESTAMPTZ,
  column_definitions JSONB NOT NULL DEFAULT '[]'::jsonb,
  row_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Store actual data rows
CREATE TABLE dataset_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Store saved visualizations
CREATE TABLE visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  viz_type TEXT NOT NULL CHECK (viz_type IN ('bar', 'line', 'pie', 'pivot_table', 'scatter', 'area')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Store dashboards (collections of visualizations)
CREATE TABLE dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  layout JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Link visualizations to dashboards
CREATE TABLE dashboard_visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
  visualization_id UUID REFERENCES visualizations(id) ON DELETE CASCADE,
  position JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataset_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE visualizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_visualizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for datasets
CREATE POLICY "Users can view their own datasets"
  ON datasets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own datasets"
  ON datasets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own datasets"
  ON datasets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own datasets"
  ON datasets FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for dataset_rows
CREATE POLICY "Users can view rows from their datasets"
  ON dataset_rows FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM datasets
      WHERE datasets.id = dataset_rows.dataset_id
      AND datasets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert rows to their datasets"
  ON dataset_rows FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM datasets
      WHERE datasets.id = dataset_rows.dataset_id
      AND datasets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rows in their datasets"
  ON dataset_rows FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM datasets
      WHERE datasets.id = dataset_rows.dataset_id
      AND datasets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete rows from their datasets"
  ON dataset_rows FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM datasets
      WHERE datasets.id = dataset_rows.dataset_id
      AND datasets.user_id = auth.uid()
    )
  );

-- RLS Policies for visualizations
CREATE POLICY "Users can view their own visualizations"
  ON visualizations FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own visualizations"
  ON visualizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visualizations"
  ON visualizations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visualizations"
  ON visualizations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for dashboards
CREATE POLICY "Users can view their own dashboards"
  ON dashboards FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own dashboards"
  ON dashboards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboards"
  ON dashboards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboards"
  ON dashboards FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for dashboard_visualizations
CREATE POLICY "Users can view visualizations in their dashboards"
  ON dashboard_visualizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dashboards
      WHERE dashboards.id = dashboard_visualizations.dashboard_id
      AND (dashboards.user_id = auth.uid() OR dashboards.is_public = true)
    )
  );

CREATE POLICY "Users can add visualizations to their dashboards"
  ON dashboard_visualizations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dashboards
      WHERE dashboards.id = dashboard_visualizations.dashboard_id
      AND dashboards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update visualizations in their dashboards"
  ON dashboard_visualizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM dashboards
      WHERE dashboards.id = dashboard_visualizations.dashboard_id
      AND dashboards.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove visualizations from their dashboards"
  ON dashboard_visualizations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM dashboards
      WHERE dashboards.id = dashboard_visualizations.dashboard_id
      AND dashboards.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_datasets_user_id ON datasets(user_id);
CREATE INDEX idx_dataset_rows_dataset_id ON dataset_rows(dataset_id);
CREATE INDEX idx_visualizations_dataset_id ON visualizations(dataset_id);
CREATE INDEX idx_visualizations_user_id ON visualizations(user_id);
CREATE INDEX idx_dashboards_user_id ON dashboards(user_id);
CREATE INDEX idx_dashboard_visualizations_dashboard_id ON dashboard_visualizations(dashboard_id);
CREATE INDEX idx_dashboard_visualizations_visualization_id ON dashboard_visualizations(visualization_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_datasets_updated_at
  BEFORE UPDATE ON datasets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visualizations_updated_at
  BEFORE UPDATE ON visualizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at
  BEFORE UPDATE ON dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();