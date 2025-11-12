-- Fix foreign key constraint on entity_change_log to allow entity deletion
-- The issue: when deleting an entity, the trigger tries to log the change
-- but the FK constraint fails because the entity is being deleted

ALTER TABLE entity_change_log
DROP CONSTRAINT IF EXISTS entity_change_log_entity_id_fkey;

ALTER TABLE entity_change_log
ADD CONSTRAINT entity_change_log_entity_id_fkey
FOREIGN KEY (entity_id)
REFERENCES system_entities(id)
ON DELETE SET NULL;