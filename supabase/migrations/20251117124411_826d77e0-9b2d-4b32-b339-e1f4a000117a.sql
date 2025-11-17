-- Delete all generated child tasks (keep parent templates)
DELETE FROM tasks WHERE parent_task_id IS NOT NULL;

-- Remove parent_task_id column (no longer needed)
ALTER TABLE tasks DROP COLUMN IF EXISTS parent_task_id;