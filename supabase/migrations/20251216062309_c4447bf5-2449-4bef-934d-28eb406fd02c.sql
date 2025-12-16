-- Create GDN Target Lists table
CREATE TABLE public.gdn_target_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  entity TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create GDN Target Items table
CREATE TABLE public.gdn_target_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES public.gdn_target_lists(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('website', 'youtube', 'app')),
  url TEXT NOT NULL,
  name TEXT,
  ads_txt_has_google BOOLEAN,
  ads_txt_checked_at TIMESTAMP WITH TIME ZONE,
  ads_txt_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gdn_target_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gdn_target_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gdn_target_lists
CREATE POLICY "Target lists viewable by authenticated users"
ON public.gdn_target_lists FOR SELECT
USING (true);

CREATE POLICY "Users can create target lists"
ON public.gdn_target_lists FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own target lists"
ON public.gdn_target_lists FOR UPDATE
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own target lists"
ON public.gdn_target_lists FOR DELETE
USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for gdn_target_items
CREATE POLICY "Target items viewable by authenticated users"
ON public.gdn_target_items FOR SELECT
USING (true);

CREATE POLICY "Users can create target items"
ON public.gdn_target_items FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.gdn_target_lists 
  WHERE id = list_id AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Users can update target items"
ON public.gdn_target_items FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.gdn_target_lists 
  WHERE id = list_id AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

CREATE POLICY "Users can delete target items"
ON public.gdn_target_items FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.gdn_target_lists 
  WHERE id = list_id AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
));

-- Create indexes for performance
CREATE INDEX idx_gdn_target_items_list_id ON public.gdn_target_items(list_id);
CREATE INDEX idx_gdn_target_items_item_type ON public.gdn_target_items(item_type);
CREATE INDEX idx_gdn_target_lists_entity ON public.gdn_target_lists(entity);