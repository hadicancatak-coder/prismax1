-- Rename scope_of_work to kpis for better semantic clarity
ALTER TABLE profiles 
RENAME COLUMN scope_of_work TO kpis;

-- Add comment for documentation
COMMENT ON COLUMN profiles.kpis IS 'Key Performance Indicators and responsibilities for the team member';