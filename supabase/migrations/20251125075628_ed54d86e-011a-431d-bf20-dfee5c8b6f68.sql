-- Fix the broken sync_task_to_operation_audit trigger using CASCADE
-- The operation_audit_item_comments table doesn't have a status column

DROP FUNCTION IF EXISTS sync_task_to_operation_audit() CASCADE;