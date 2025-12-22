-- Create keyword_lists table (parent)
CREATE TABLE public.keyword_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  entity TEXT NOT NULL,
  description TEXT,
  source_file TEXT,
  keyword_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create keyword_list_items table (child)
CREATE TABLE public.keyword_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.keyword_lists(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  opportunity_score INTEGER,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC,
  cost NUMERIC,
  conversions NUMERIC,
  campaign TEXT,
  ad_group TEXT,
  match_type TEXT,
  action_taken TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.keyword_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keyword_list_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for keyword_lists
CREATE POLICY "Users can view all keyword lists"
  ON public.keyword_lists
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create keyword lists"
  ON public.keyword_lists
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own keyword lists"
  ON public.keyword_lists
  FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own keyword lists"
  ON public.keyword_lists
  FOR DELETE
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for keyword_list_items
CREATE POLICY "Users can view keyword list items"
  ON public.keyword_list_items
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert items to own lists"
  ON public.keyword_list_items
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.keyword_lists
    WHERE id = list_id AND created_by = auth.uid()
  ));

CREATE POLICY "Users can update items in own lists"
  ON public.keyword_list_items
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.keyword_lists
    WHERE id = list_id AND created_by = auth.uid()
  ));

CREATE POLICY "Users can delete items from own lists"
  ON public.keyword_list_items
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.keyword_lists
    WHERE id = list_id AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  ));

-- Create indexes for performance
CREATE INDEX idx_keyword_lists_entity ON public.keyword_lists(entity);
CREATE INDEX idx_keyword_lists_created_by ON public.keyword_lists(created_by);
CREATE INDEX idx_keyword_list_items_list_id ON public.keyword_list_items(list_id);
CREATE INDEX idx_keyword_list_items_action ON public.keyword_list_items(action_taken);

-- Trigger to update updated_at
CREATE TRIGGER update_keyword_lists_updated_at
  BEFORE UPDATE ON public.keyword_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();