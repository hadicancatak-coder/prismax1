-- Phase 1: Add columns for pending change tracking
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS pending_changes jsonb DEFAULT '{}'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS change_requested_fields text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN tasks.pending_changes IS 'Stores requested changes by members awaiting admin approval';
COMMENT ON COLUMN tasks.change_requested_fields IS 'Array of field names that require approval';