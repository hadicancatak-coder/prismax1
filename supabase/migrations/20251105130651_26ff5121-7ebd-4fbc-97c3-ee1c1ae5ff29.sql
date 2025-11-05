-- Create app_role enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create KPIs table
CREATE TABLE IF NOT EXISTS public.kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  metric_type text NOT NULL CHECK (metric_type IN ('percentage', 'count')),
  target numeric NOT NULL,
  deadline timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create KPI assignments table
CREATE TABLE IF NOT EXISTS public.kpi_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id uuid REFERENCES public.kpis(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(kpi_id, user_id)
);

-- Enable RLS on kpis table
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;

-- Enable RLS on kpi_assignments table
ALTER TABLE public.kpi_assignments ENABLE ROW LEVEL SECURITY;

-- Create has_role function if it doesn't exist
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for kpis table
CREATE POLICY "Admins can manage all KPIs"
ON public.kpis
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view KPIs assigned to them"
ON public.kpis
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.kpi_assignments
    WHERE kpi_id = kpis.id AND user_id = auth.uid()
  )
);

-- RLS policies for kpi_assignments table
CREATE POLICY "Admins can manage all KPI assignments"
ON public.kpi_assignments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own KPI assignments"
ON public.kpi_assignments
FOR SELECT
USING (user_id = auth.uid());

-- Create updated_at trigger for kpis
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kpis_updated_at
BEFORE UPDATE ON public.kpis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();