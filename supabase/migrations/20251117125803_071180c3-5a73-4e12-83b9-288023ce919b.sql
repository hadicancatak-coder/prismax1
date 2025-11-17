-- Clean up task_type enum to only have the three values we need
-- First, update any remaining old values to new values
UPDATE tasks SET task_type = 'generic' WHERE task_type = 'task';
UPDATE tasks SET task_type = 'campaign' WHERE task_type = 'campaign_launch';
UPDATE tasks SET task_type = 'generic' WHERE task_type = 'operations';

-- Drop the default value temporarily
ALTER TABLE tasks ALTER COLUMN task_type DROP DEFAULT;

-- Now recreate the enum with only the three values we want
ALTER TYPE task_type RENAME TO task_type_old;

CREATE TYPE task_type AS ENUM ('generic', 'campaign', 'recurring');

-- Update the column to use the new enum
ALTER TABLE tasks 
  ALTER COLUMN task_type TYPE task_type 
  USING task_type::text::task_type;

-- Drop the old enum
DROP TYPE task_type_old;

-- Restore default value
ALTER TABLE tasks ALTER COLUMN task_type SET DEFAULT 'generic';

-- Add comment for documentation
COMMENT ON TYPE task_type IS 'Task types: generic (standard tasks), campaign (campaign-specific), recurring (recurring tasks)';