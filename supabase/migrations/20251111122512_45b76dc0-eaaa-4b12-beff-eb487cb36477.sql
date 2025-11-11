-- Create security scan results table
CREATE TABLE IF NOT EXISTS public.security_scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_type TEXT NOT NULL,
  scan_status TEXT NOT NULL DEFAULT 'running',
  findings JSONB DEFAULT '[]'::jsonb,
  summary JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_scan_results ENABLE ROW LEVEL SECURITY;

-- Only admins can view scan results
CREATE POLICY "Admins can view security scan results"
  ON public.security_scan_results
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- System can insert scan results
CREATE POLICY "System can create security scan results"
  ON public.security_scan_results
  FOR INSERT
  WITH CHECK (true);

-- System can update scan results
CREATE POLICY "System can update security scan results"
  ON public.security_scan_results
  FOR UPDATE
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_security_scans_type ON public.security_scan_results(scan_type);
CREATE INDEX idx_security_scans_status ON public.security_scan_results(scan_status);
CREATE INDEX idx_security_scans_created ON public.security_scan_results(created_at DESC);

-- Create suspicious activity tracking table
CREATE TABLE IF NOT EXISTS public.suspicious_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suspicious_activities ENABLE ROW LEVEL SECURITY;

-- Admins can manage suspicious activities
CREATE POLICY "Admins can view suspicious activities"
  ON public.suspicious_activities
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update suspicious activities"
  ON public.suspicious_activities
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- System can insert suspicious activities
CREATE POLICY "System can create suspicious activities"
  ON public.suspicious_activities
  FOR INSERT
  WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_suspicious_activities_user ON public.suspicious_activities(user_id);
CREATE INDEX idx_suspicious_activities_type ON public.suspicious_activities(activity_type);
CREATE INDEX idx_suspicious_activities_resolved ON public.suspicious_activities(resolved);
CREATE INDEX idx_suspicious_activities_created ON public.suspicious_activities(created_at DESC);

-- Function to get active admin users for notifications
CREATE OR REPLACE FUNCTION public.get_admin_user_ids()
RETURNS TABLE(user_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ur.user_id
  FROM user_roles ur
  WHERE ur.role = 'admin';
$$;