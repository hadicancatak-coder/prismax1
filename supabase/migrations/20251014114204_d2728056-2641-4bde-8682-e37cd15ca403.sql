-- 1. Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- Enable RLS on announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Announcements policies
CREATE POLICY "Announcements viewable by authenticated users"
ON public.announcements FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Only admins can manage announcements"
ON public.announcements FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Alter campaigns.entity to TEXT[]
ALTER TABLE public.campaigns 
ALTER COLUMN entity TYPE TEXT[] USING 
  CASE 
    WHEN entity IS NULL THEN '{}'::TEXT[]
    WHEN entity = '' THEN '{}'::TEXT[]
    ELSE ARRAY[entity]
  END;

ALTER TABLE public.campaigns 
ALTER COLUMN entity SET DEFAULT '{}'::TEXT[];

-- 3. Alter tasks.entity to TEXT[]
ALTER TABLE public.tasks 
ALTER COLUMN entity TYPE TEXT[] USING 
  CASE 
    WHEN entity IS NULL THEN '{}'::TEXT[]
    WHEN entity = '' THEN '{}'::TEXT[]
    ELSE ARRAY[entity]
  END;

ALTER TABLE public.tasks 
ALTER COLUMN entity SET DEFAULT '{}'::TEXT[];