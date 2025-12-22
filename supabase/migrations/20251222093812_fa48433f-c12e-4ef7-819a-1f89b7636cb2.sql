-- =====================================================
-- KEYWORD INTEL ENGINE: DATABASE TABLES
-- =====================================================

-- Table 1: keyword_dictionaries (brand terms, competitors, custom terms)
CREATE TABLE public.keyword_dictionaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dict_name TEXT NOT NULL CHECK (dict_name IN ('brand_terms', 'competitors')),
  canonical TEXT NOT NULL,
  alias TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(dict_name, canonical, alias)
);

-- Enable RLS
ALTER TABLE public.keyword_dictionaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view dictionaries"
  ON public.keyword_dictionaries FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage dictionaries"
  ON public.keyword_dictionaries FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert dictionaries"
  ON public.keyword_dictionaries FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update dictionaries"
  ON public.keyword_dictionaries FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER update_keyword_dictionaries_updated_at
  BEFORE UPDATE ON public.keyword_dictionaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Table 2: keyword_custom_rules
-- =====================================================
CREATE TABLE public.keyword_custom_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  pattern TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'contains_phrase' CHECK (match_type IN ('contains_phrase', 'regex')),
  target_cluster_primary TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.keyword_custom_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view custom rules"
  ON public.keyword_custom_rules FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage custom rules"
  ON public.keyword_custom_rules FOR ALL
  USING (auth.role() = 'authenticated');

-- =====================================================
-- Table 3: keyword_leakage_suggestions
-- =====================================================
CREATE TABLE public.keyword_leakage_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('alias_candidate', 'dictionary_candidate', 'new_rule_candidate')),
  extracted_phrase TEXT NOT NULL,
  evidence_terms JSONB DEFAULT '[]'::jsonb,
  evidence_cost NUMERIC DEFAULT 0,
  evidence_clicks INTEGER DEFAULT 0,
  proposed_dict_name TEXT,
  proposed_canonical TEXT,
  proposed_alias TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  accept_as TEXT CHECK (accept_as IN ('competitors', 'brand_terms', 'custom_rules')),
  chosen_canonical TEXT,
  chosen_alias TEXT,
  chosen_cluster_primary TEXT,
  chosen_rule_pattern TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.keyword_leakage_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view suggestions"
  ON public.keyword_leakage_suggestions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage suggestions"
  ON public.keyword_leakage_suggestions FOR ALL
  USING (auth.role() = 'authenticated');

-- =====================================================
-- SEED DATA: Competitors (Tier-1)
-- =====================================================
INSERT INTO public.keyword_dictionaries (dict_name, canonical, alias) VALUES
-- capital.com
('competitors', 'capital.com', 'capital.com'),
('competitors', 'capital.com', 'capital com'),
('competitors', 'capital.com', 'capitalcom'),
-- exness
('competitors', 'exness', 'exness'),
-- etoro
('competitors', 'etoro', 'etoro'),
('competitors', 'etoro', 'e toro'),
-- adss
('competitors', 'adss', 'adss'),
-- equiti
('competitors', 'equiti', 'equiti'),
('competitors', 'equiti', 'equiti group'),
-- xm
('competitors', 'xm', 'xm'),
('competitors', 'xm', 'xm.com'),
-- fxtm
('competitors', 'fxtm', 'fxtm'),
('competitors', 'fxtm', 'forextime'),
-- plus500
('competitors', 'plus500', 'plus500'),
-- daman markets
('competitors', 'daman markets', 'daman markets'),
('competitors', 'daman markets', 'damanmarket'),
-- sarwa
('competitors', 'sarwa', 'sarwa'),
('competitors', 'sarwa', 'sarwa trade');

-- =====================================================
-- SEED DATA: Brand Terms (CFI)
-- =====================================================
INSERT INTO public.keyword_dictionaries (dict_name, canonical, alias) VALUES
('brand_terms', 'cfi', 'cfi'),
('brand_terms', 'cfi', 'cfi financial'),
('brand_terms', 'cfi', 'cfifinancial'),
('brand_terms', 'cfi', 'cfi trade'),
('brand_terms', 'cfi', 'cfi trading'),
('brand_terms', 'cfi', 'cfi markets');