-- Add is_template column to utm_links table for LP library management
ALTER TABLE utm_links ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

-- Add index for faster filtering of template links
CREATE INDEX IF NOT EXISTS idx_utm_links_is_template ON utm_links(is_template) WHERE is_template = TRUE;