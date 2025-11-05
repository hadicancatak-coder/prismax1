-- Add region column to copywriter_copies table
ALTER TABLE copywriter_copies 
ADD COLUMN IF NOT EXISTS region text;