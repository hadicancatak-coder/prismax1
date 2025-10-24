-- Add metadata fields to datasets table for intelligent CSV parsing
ALTER TABLE datasets 
ADD COLUMN IF NOT EXISTS granularity TEXT CHECK (granularity IN ('weekly', 'monthly', 'custom')),
ADD COLUMN IF NOT EXISTS primary_kpi_fields TEXT[],
ADD COLUMN IF NOT EXISTS date_range_start DATE,
ADD COLUMN IF NOT EXISTS date_range_end DATE,
ADD COLUMN IF NOT EXISTS detected_type TEXT CHECK (detected_type IN ('weekly_performance', 'monthly_performance', 'generic_kpi')),
ADD COLUMN IF NOT EXISTS parsing_metadata JSONB;

-- Add comment for documentation
COMMENT ON COLUMN datasets.granularity IS 'Time granularity of the dataset: weekly, monthly, or custom';
COMMENT ON COLUMN datasets.primary_kpi_fields IS 'Array of primary KPI field names detected during parsing';
COMMENT ON COLUMN datasets.date_range_start IS 'Start date of the dataset time range';
COMMENT ON COLUMN datasets.date_range_end IS 'End date of the dataset time range';
COMMENT ON COLUMN datasets.detected_type IS 'Auto-detected dataset type from filename and structure';
COMMENT ON COLUMN datasets.parsing_metadata IS 'JSON metadata about parsing transformations applied';