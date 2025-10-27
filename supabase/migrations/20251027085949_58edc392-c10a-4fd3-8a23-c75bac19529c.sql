-- Drop analytics tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS dashboard_visualizations CASCADE;
DROP TABLE IF EXISTS visualizations CASCADE;
DROP TABLE IF EXISTS dataset_rows CASCADE;
DROP TABLE IF EXISTS datasets CASCADE;
DROP TABLE IF EXISTS dashboards CASCADE;

-- Remove any analytics-related functions or triggers if they exist
DROP FUNCTION IF EXISTS update_dataset_row_count() CASCADE;