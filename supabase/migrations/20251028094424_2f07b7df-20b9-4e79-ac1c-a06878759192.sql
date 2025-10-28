-- Function to delete auto-created task when audit log is deleted
CREATE OR REPLACE FUNCTION delete_auto_created_task_on_audit_log_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only delete task if it was auto-created from this audit log
  IF OLD.task_id IS NOT NULL AND OLD.auto_assigned = true THEN
    DELETE FROM tasks WHERE id = OLD.task_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to delete auto-created tasks before deleting audit logs
CREATE TRIGGER delete_auto_task_trigger
BEFORE DELETE ON operation_audit_logs
FOR EACH ROW
EXECUTE FUNCTION delete_auto_created_task_on_audit_log_delete();