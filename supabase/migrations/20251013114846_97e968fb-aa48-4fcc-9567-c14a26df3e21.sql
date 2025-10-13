-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the reschedule-overdue-tasks function to run daily at midnight UTC
SELECT cron.schedule(
  'reschedule-overdue-tasks-daily',
  '0 0 * * *', -- midnight UTC every day
  $$
  SELECT
    net.http_post(
        url:='https://mwogxqonlzjrkktwbkma.supabase.co/functions/v1/reschedule-overdue-tasks',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13b2d4cW9ubHpqcmtrdHdia21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MjU3NjgsImV4cCI6MjA3NTMwMTc2OH0.cFfkdskt38lkpmLa3Uw9T7QqSoc-u1dYXiMRXWGdKIM"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);