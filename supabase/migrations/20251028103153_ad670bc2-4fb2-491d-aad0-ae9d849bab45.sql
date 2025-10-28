-- Create table for audit item comments
CREATE TABLE public.operation_audit_item_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.operation_audit_items(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  parent_id UUID REFERENCES public.operation_audit_item_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.operation_audit_item_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE POLICY "Authenticated users can view all comments"
  ON public.operation_audit_item_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own comments"
  ON public.operation_audit_item_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments"
  ON public.operation_audit_item_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments"
  ON public.operation_audit_item_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Admins can delete any comment"
  ON public.operation_audit_item_comments FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create table for copywriter copies
CREATE TABLE public.copywriter_copies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  element_type TEXT NOT NULL,
  content_en TEXT,
  content_ar TEXT,
  content_az TEXT,
  content_es TEXT,
  platform TEXT[] NOT NULL DEFAULT '{}',
  entity TEXT[] NOT NULL DEFAULT '{}',
  campaigns TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_synced_to_planner BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.copywriter_copies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for copywriter
CREATE POLICY "Authenticated users can view all copies"
  ON public.copywriter_copies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own copies"
  ON public.copywriter_copies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own copies"
  ON public.copywriter_copies FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own copies"
  ON public.copywriter_copies FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_audit_item_comments_item_id ON public.operation_audit_item_comments(item_id);
CREATE INDEX idx_audit_item_comments_author_id ON public.operation_audit_item_comments(author_id);
CREATE INDEX idx_copywriter_copies_created_by ON public.copywriter_copies(created_by);
CREATE INDEX idx_copywriter_copies_platform ON public.copywriter_copies USING GIN(platform);
CREATE INDEX idx_copywriter_copies_entity ON public.copywriter_copies USING GIN(entity);

-- Trigger for updated_at on comments
CREATE TRIGGER update_audit_item_comments_updated_at
  BEFORE UPDATE ON public.operation_audit_item_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on copywriter copies
CREATE TRIGGER update_copywriter_copies_updated_at
  BEFORE UPDATE ON public.copywriter_copies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();