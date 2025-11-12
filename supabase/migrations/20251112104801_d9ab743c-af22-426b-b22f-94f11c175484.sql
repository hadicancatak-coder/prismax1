-- Make the foreign key constraint deferrable so it's checked after triggers complete
-- This allows the log_entity_changes trigger to insert a record during DELETE
-- and the constraint will be validated at transaction end

ALTER TABLE entity_change_log
DROP CONSTRAINT IF EXISTS entity_change_log_entity_id_fkey;

ALTER TABLE entity_change_log
ADD CONSTRAINT entity_change_log_entity_id_fkey
FOREIGN KEY (entity_id)
REFERENCES system_entities(id)
ON DELETE SET NULL
DEFERRABLE INITIALLY DEFERRED;