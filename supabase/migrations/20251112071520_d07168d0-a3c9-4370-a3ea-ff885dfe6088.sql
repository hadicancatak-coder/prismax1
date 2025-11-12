-- Create landing_page_templates table for Ready Links
CREATE TABLE IF NOT EXISTS public.landing_page_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  base_url TEXT NOT NULL,
  lp_type TEXT CHECK (lp_type IN ('static', 'dynamic')),
  purpose TEXT CHECK (purpose IN ('AO', 'Webinar', 'Seminar')),
  country TEXT,
  language TEXT DEFAULT 'EN',
  platform TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.landing_page_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own templates
CREATE POLICY "Users can view own LP templates"
ON public.landing_page_templates
FOR SELECT
USING (auth.uid() = created_by);

-- Users can create their own templates
CREATE POLICY "Users can create own LP templates"
ON public.landing_page_templates
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Users can update their own templates
CREATE POLICY "Users can update own LP templates"
ON public.landing_page_templates
FOR UPDATE
USING (auth.uid() = created_by);

-- Users can delete their own templates
CREATE POLICY "Users can delete own LP templates"
ON public.landing_page_templates
FOR DELETE
USING (auth.uid() = created_by);

-- Admins can manage all templates
CREATE POLICY "Admins can manage all LP templates"
ON public.landing_page_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better query performance
CREATE INDEX idx_landing_page_templates_created_by ON public.landing_page_templates(created_by);

-- Fix task_assignees RLS policy to properly check profile.id
DROP POLICY IF EXISTS "Users can assign to tasks" ON public.task_assignees;

CREATE POLICY "Users can assign to tasks"
ON public.task_assignees
FOR INSERT
WITH CHECK (
  -- Allow if assigned_by matches current user's profile.id
  assigned_by IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);