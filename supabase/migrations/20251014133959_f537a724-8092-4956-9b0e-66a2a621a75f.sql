-- Add jira_links column to launch_pad_campaigns table
ALTER TABLE launch_pad_campaigns 
ADD COLUMN jira_links jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN launch_pad_campaigns.jira_links IS 'Array of Jira ticket links (Atlassian URLs)';

-- Add jira_links column to tasks table  
ALTER TABLE tasks
ADD COLUMN jira_links jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN tasks.jira_links IS 'Array of multiple Jira ticket links';

-- Migrate existing jira_link to jira_links array
UPDATE tasks 
SET jira_links = jsonb_build_array(jira_link)
WHERE jira_link IS NOT NULL AND jira_link != '';