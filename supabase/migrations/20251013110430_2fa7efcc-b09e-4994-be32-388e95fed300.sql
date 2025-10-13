-- Update task_status enum to have the new statuses
ALTER TYPE task_status RENAME TO task_status_old;

CREATE TYPE task_status AS ENUM ('Pending', 'Ongoing', 'Failed', 'Blocked', 'Completed');

ALTER TABLE tasks ALTER COLUMN status DROP DEFAULT;
ALTER TABLE tasks ALTER COLUMN status TYPE task_status USING 
  CASE status::text
    WHEN 'In Progress' THEN 'Ongoing'::task_status
    WHEN 'Done' THEN 'Completed'::task_status
    WHEN 'Blocked' THEN 'Blocked'::task_status
    ELSE 'Pending'::task_status
  END;
ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'Pending'::task_status;

DROP TYPE task_status_old;