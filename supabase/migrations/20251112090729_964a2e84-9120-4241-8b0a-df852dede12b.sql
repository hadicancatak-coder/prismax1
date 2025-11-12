-- 1. Create missing kpi_targets table
CREATE TABLE IF NOT EXISTS public.kpi_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID NOT NULL REFERENCES public.kpis(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_name TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.kpi_targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "KPI targets viewable by authenticated users"
  ON public.kpi_targets FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage KPI targets"
  ON public.kpi_targets FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix entity_change_log foreign key cascade
ALTER TABLE public.entity_change_log 
  DROP CONSTRAINT IF EXISTS entity_change_log_entity_id_fkey;

ALTER TABLE public.entity_change_log
  ADD CONSTRAINT entity_change_log_entity_id_fkey
  FOREIGN KEY (entity_id) 
  REFERENCES public.system_entities(id) 
  ON DELETE CASCADE;