-- Add task_id to operation_audit_item_comments for linking
ALTER TABLE operation_audit_item_comments 
ADD COLUMN task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- Create trigger for task completion → operation item completion
CREATE OR REPLACE FUNCTION sync_task_to_operation_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
    UPDATE operation_audit_item_comments 
    SET status = 'completed'
    WHERE task_id = NEW.id AND status != 'completed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_completion_sync_audit
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION sync_task_to_operation_audit();