-- Create knowledge_pages table for Confluence-like wiki
CREATE TABLE public.knowledge_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT DEFAULT '',
  parent_id UUID REFERENCES public.knowledge_pages(id) ON DELETE SET NULL,
  icon TEXT DEFAULT 'file-text',
  order_index INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

-- Create index for parent lookups
CREATE INDEX idx_knowledge_pages_parent ON public.knowledge_pages(parent_id);
CREATE INDEX idx_knowledge_pages_slug ON public.knowledge_pages(slug);

-- Enable RLS
ALTER TABLE public.knowledge_pages ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "Knowledge pages readable by authenticated users"
ON public.knowledge_pages FOR SELECT
USING (auth.role() = 'authenticated');

-- Only admins can insert
CREATE POLICY "Admins can create knowledge pages"
ON public.knowledge_pages FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update
CREATE POLICY "Admins can update knowledge pages"
ON public.knowledge_pages FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete knowledge pages"
ON public.knowledge_pages FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_knowledge_pages_updated_at
BEFORE UPDATE ON public.knowledge_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();