-- Create error logs table for centralized error tracking
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  error_type TEXT NOT NULL CHECK (error_type IN ('database', 'auth', 'api', 'edge_function', 'frontend')),
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON public.error_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON public.error_logs(error_type);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view error logs
CREATE POLICY "Admins can view error logs"
  ON public.error_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert error logs (system can also insert via service role)
CREATE POLICY "System can insert error logs"
  ON public.error_logs FOR INSERT
  WITH CHECK (true);

-- Only admins can update error logs (mark as resolved)
CREATE POLICY "Admins can update error logs"
  ON public.error_logs FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create approval history table for tracking all approvals
CREATE TABLE IF NOT EXISTS public.approval_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'ad', 'campaign', 'launch_campaign')),
  entity_id UUID NOT NULL,
  requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('approved', 'rejected')),
  changes JSONB NOT NULL DEFAULT '{}',
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_history_entity ON public.approval_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_created_at ON public.approval_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_history_requester ON public.approval_history(requester_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_approver ON public.approval_history(approver_id);

-- Enable RLS
ALTER TABLE public.approval_history ENABLE ROW LEVEL SECURITY;

-- Admins can view all approval history
CREATE POLICY "Admins can view approval history"
  ON public.approval_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert approval history
CREATE POLICY "System can insert approval history"
  ON public.approval_history FOR INSERT
  WITH CHECK (true);

-- Create admin audit log for tracking admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changes JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target_user ON public.admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON public.admin_audit_log(action);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (true);