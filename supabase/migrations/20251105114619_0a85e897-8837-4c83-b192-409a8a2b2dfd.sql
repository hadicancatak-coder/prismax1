-- Add character limit columns for each language in copywriter_copies table
ALTER TABLE copywriter_copies
ADD COLUMN IF NOT EXISTS char_limit_en INTEGER DEFAULT 125,
ADD COLUMN IF NOT EXISTS char_limit_ar INTEGER DEFAULT 125,
ADD COLUMN IF NOT EXISTS char_limit_az INTEGER DEFAULT 125,
ADD COLUMN IF NOT EXISTS char_limit_es INTEGER DEFAULT 125;