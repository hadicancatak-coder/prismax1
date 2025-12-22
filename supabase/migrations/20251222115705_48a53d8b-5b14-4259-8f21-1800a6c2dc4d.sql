-- Create user_visits table to track actual site visits
CREATE TABLE public.user_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  visit_hour TEXT NOT NULL DEFAULT to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD-HH24'),
  ip_address TEXT,
  user_agent TEXT
);

-- Create index for efficient queries by user and date
CREATE INDEX idx_user_visits_user_date ON public.user_visits(user_id, visited_at DESC);

-- Create unique constraint to prevent duplicate visits within 1 hour window
CREATE UNIQUE INDEX idx_user_visits_unique_hourly ON public.user_visits(user_id, visit_hour);

-- Enable RLS
ALTER TABLE public.user_visits ENABLE ROW LEVEL SECURITY;

-- Users can insert their own visits
CREATE POLICY "Users can insert own visits" 
ON public.user_visits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can view own visits, admins can view all
CREATE POLICY "Users can view own visits, admins can view all" 
ON public.user_visits 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Seed initial data from mfa_sessions (convert existing MFA sessions to visits)
INSERT INTO public.user_visits (user_id, visited_at, visit_hour)
SELECT user_id, created_at, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD-HH24')
FROM public.mfa_sessions
WHERE created_at >= now() - INTERVAL '30 days'
ON CONFLICT (user_id, visit_hour) DO NOTHING;