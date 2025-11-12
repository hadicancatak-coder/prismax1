-- Remove foreign key constraint from entity_change_log
-- Audit log tables should not have FK constraints so historical records
-- persist even when referenced entities are deleted
-- The old_value/new_value JSON fields contain the full entity data anyway

ALTER TABLE entity_change_log
DROP CONSTRAINT IF EXISTS entity_change_log_entity_id_fkey;