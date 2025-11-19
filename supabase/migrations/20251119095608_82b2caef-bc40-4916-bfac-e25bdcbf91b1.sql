-- Restore task_comment_counts materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS task_comment_counts AS
SELECT 
  task_id,
  COUNT(*)::bigint as comment_count
FROM comments
GROUP BY task_id;

-- Create unique index for efficient joins and concurrent refreshes
CREATE UNIQUE INDEX IF NOT EXISTS task_comment_counts_task_id_idx ON task_comment_counts(task_id);

-- Refresh the view to populate it with current data
REFRESH MATERIALIZED VIEW task_comment_counts;

-- Grant select access
GRANT SELECT ON task_comment_counts TO authenticated;

-- Enable RLS (though materialized views inherit from base tables)
ALTER MATERIALIZED VIEW task_comment_counts OWNER TO postgres;