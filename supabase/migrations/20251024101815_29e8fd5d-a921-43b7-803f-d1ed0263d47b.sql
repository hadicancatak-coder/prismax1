-- Add dimension support to dataset_rows and datasets
ALTER TABLE dataset_rows 
ADD COLUMN dimension TEXT,
ADD COLUMN dimension_type TEXT CHECK (dimension_type IN ('country', 'region', 'channel', 'product', 'custom', 'total'));

-- Add index for dimension filtering
CREATE INDEX idx_dataset_rows_dimension 
ON dataset_rows(dataset_id, dimension) 
WHERE dimension IS NOT NULL;

-- Update datasets table to store dimension metadata
ALTER TABLE datasets
ADD COLUMN has_dimensions BOOLEAN DEFAULT false,
ADD COLUMN dimension_values TEXT[] DEFAULT '{}',
ADD COLUMN structure_config JSONB DEFAULT '{}'::jsonb;