-- Create custom_reports table for storing custom report documents
CREATE TABLE public.custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  elements JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
ON public.custom_reports
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own reports
CREATE POLICY "Users can create own reports"
ON public.custom_reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reports
CREATE POLICY "Users can update own reports"
ON public.custom_reports
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reports
CREATE POLICY "Users can delete own reports"
ON public.custom_reports
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all reports
CREATE POLICY "Admins can manage all reports"
ON public.custom_reports
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_custom_reports_user_id ON public.custom_reports(user_id);
CREATE INDEX idx_custom_reports_updated_at ON public.custom_reports(updated_at DESC);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_custom_reports_updated_at
BEFORE UPDATE ON public.custom_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();