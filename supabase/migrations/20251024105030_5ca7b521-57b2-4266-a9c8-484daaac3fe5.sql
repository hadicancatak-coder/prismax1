-- Add time_key_parsed column to dataset_rows for proper date filtering and sorting
ALTER TABLE dataset_rows 
ADD COLUMN time_key_parsed DATE;

-- Create index for better query performance
CREATE INDEX idx_dataset_rows_time_parsed 
ON dataset_rows(dataset_id, time_key_parsed);

-- Add Google Sheets sync fields to datasets table
ALTER TABLE datasets
ADD COLUMN sync_frequency TEXT CHECK (sync_frequency IN ('manual', 'hourly', 'daily')),
ADD COLUMN last_sync_error TEXT;