-- Create entity_comments table for entity-level comments
CREATE TABLE IF NOT EXISTS entity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  author_email TEXT,
  is_external BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE entity_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view entity comments"
  ON entity_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert entity comments"
  ON entity_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own entity comments"
  ON entity_comments FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own entity comments"
  ON entity_comments FOR DELETE
  USING (auth.uid() = author_id);

-- Add index for faster queries
CREATE INDEX idx_entity_comments_entity ON entity_comments(entity);
CREATE INDEX idx_entity_comments_created_at ON entity_comments(created_at DESC);