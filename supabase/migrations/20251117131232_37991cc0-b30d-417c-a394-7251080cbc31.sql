-- Add notes column to campaigns table for campaign log notes
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS notes TEXT;