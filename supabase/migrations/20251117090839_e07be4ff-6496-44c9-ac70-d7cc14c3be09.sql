-- Add status column to copywriter_copies table
ALTER TABLE copywriter_copies 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'rejected'));

-- Change entity from single value to array to support multiple entities
ALTER TABLE copywriter_copies 
ALTER COLUMN entity TYPE TEXT[] USING ARRAY[entity];

-- Update existing NULL entities to empty array
UPDATE copywriter_copies 
SET entity = '{}' 
WHERE entity IS NULL;