-- Drop existing constraint
ALTER TABLE launch_pad_campaigns DROP CONSTRAINT IF EXISTS launch_pad_campaigns_status_check;

-- Update pending to launchpad
UPDATE launch_pad_campaigns SET status = 'launchpad' WHERE status = 'pending';

-- Update default first
ALTER TABLE launch_pad_campaigns ALTER COLUMN status SET DEFAULT 'launchpad';

-- Add constraint that allows all valid statuses
ALTER TABLE launch_pad_campaigns 
ADD CONSTRAINT launch_pad_campaigns_status_check 
CHECK (status IN ('launchpad', 'live', 'orbit', 'landed')) NOT VALID;

-- Validate constraint
ALTER TABLE launch_pad_campaigns VALIDATE CONSTRAINT launch_pad_campaigns_status_check;