-- Create tech_stack_pages table (same structure as knowledge_pages)
CREATE TABLE public.tech_stack_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT,
  parent_id UUID REFERENCES public.tech_stack_pages(id) ON DELETE SET NULL,
  icon TEXT,
  order_index INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.tech_stack_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: All authenticated can read, admin-only write
CREATE POLICY "Tech stack pages viewable by authenticated users"
  ON public.tech_stack_pages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert tech stack pages"
  ON public.tech_stack_pages FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update tech stack pages"
  ON public.tech_stack_pages FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete tech stack pages"
  ON public.tech_stack_pages FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for parent lookups
CREATE INDEX idx_tech_stack_pages_parent ON public.tech_stack_pages(parent_id);
CREATE INDEX idx_tech_stack_pages_slug ON public.tech_stack_pages(slug);