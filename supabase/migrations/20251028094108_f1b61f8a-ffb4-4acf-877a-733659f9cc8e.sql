-- Add 'operations' to task_type enum to support auto-created tasks from audit logs
ALTER TYPE task_type ADD VALUE IF NOT EXISTS 'operations';