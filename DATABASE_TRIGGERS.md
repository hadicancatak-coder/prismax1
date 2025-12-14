# Database Triggers Guide

This document captures lessons learned from trigger-related incidents that broke core functionality.

## Critical Rule: Never Block Writes

### ❌ ANTI-PATTERN: Triggers That Insert to Tables with auth.users FK

```sql
-- BROKEN - Causes 23503 FK constraint violations
CREATE OR REPLACE FUNCTION notify_task_change()
RETURNS TRIGGER AS $$
BEGIN
  -- This BLOCKS the original INSERT/UPDATE if notification insert fails!
  INSERT INTO notifications (user_id, type, message)
  VALUES (NEW.assignee_id, 'task_changed', 'Task updated');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_change_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_change();
```

**Why it breaks:** If `notifications.user_id` references `auth.users(id)` or if `NEW.assignee_id` is a profile ID (not auth user ID), the insert fails with FK violation, which **rolls back the entire task update**.

### ✅ CORRECT: Async Notification Pattern (No Triggers on Core Tables)

```sql
-- CORRECT - Use a separate queue table with no FK constraints
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL,  -- No FK!
  notification_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Edge function or cron job processes queue asynchronously
-- Core table writes are never blocked
```

---

## Safe Trigger Patterns

### ✅ Triggers That Only Modify the Same Row

```sql
-- SAFE - Only modifies NEW row, no external writes
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### ✅ Triggers That Log to Tables Without FK Constraints

```sql
-- SAFE - activity_logs has no FK to auth.users
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,  -- No FK constraint!
  action TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_id)
  VALUES (auth.uid(), TG_OP, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Emergency Trigger Removal

When triggers break core functionality, remove them immediately:

```sql
-- List all triggers on a table
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgrelid = 'public.tasks'::regclass;

-- Drop a specific trigger
DROP TRIGGER IF EXISTS task_change_trigger ON public.tasks;

-- Drop all triggers on tasks table (nuclear option)
DO $$
DECLARE
  trigger_name TEXT;
BEGIN
  FOR trigger_name IN
    SELECT tgname FROM pg_trigger 
    WHERE tgrelid = 'public.tasks'::regclass
    AND tgisinternal = false
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.tasks', trigger_name);
  END LOOP;
END;
$$;
```

---

## Testing Triggers Safely

### Before Deploying

1. **Test in isolation** - Create trigger on test table first
2. **Check FK constraints** - Ensure target tables have no FKs that could fail
3. **Test failure scenarios** - What happens if the trigger's INSERT fails?
4. **Monitor after deploy** - Watch for 23503 errors in logs

### Test Query

```sql
-- Check if a trigger exists and what it does
SELECT 
  tgname,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgrelid = 'public.tasks'::regclass
AND tgisinternal = false;
```

---

## Current State: Notifications Disabled

As of this writing, all notification triggers have been removed from `tasks` and `task_assignees` tables because they were causing 23503 FK violations that blocked all task operations.

**Removed triggers:**
- `blocker_resolved_trigger`
- `notify_on_task_field_updates`
- `task_assignment_notification`
- `task_team_assignment_trigger`
- `trigger_notify_task_deadline`
- `trigger_notify_task_priority`
- `trigger_notify_task_status`
- `trigger_notify_task_assigned`

**Future notification implementation must use async queue pattern.**

---

## Checklist for New Triggers

- [ ] Does this trigger INSERT/UPDATE to another table?
- [ ] Does that target table have FK constraints?
- [ ] If yes, could those FK lookups fail?
- [ ] If the trigger fails, does it block the original operation?
- [ ] Have I tested with invalid/edge case data?
- [ ] Is there a fallback if this breaks?
