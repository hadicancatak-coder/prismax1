# Step 4: Query Performance Profiling

## Enable Slow Query Logging

Add to your Supabase SQL editor:

```sql
-- Log queries slower than 1 second
ALTER DATABASE postgres SET log_min_duration_statement = 1000;

-- View slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC
LIMIT 20;
```

## Add Indexes for Common Queries

```sql
-- Task queries
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON tasks(due_at);

-- User queries
CREATE INDEX IF NOT EXISTS idx_task_assignees_user_id ON task_assignees(user_id);
```
