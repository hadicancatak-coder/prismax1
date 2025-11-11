-- Phase 1: MFA Session IP Validation
-- Add IP validation column to mfa_sessions
ALTER TABLE public.mfa_sessions 
ADD COLUMN IF NOT EXISTS skip_validation_for_ip BOOLEAN DEFAULT false;

-- Update validation function to check IP
CREATE OR REPLACE FUNCTION public.validate_mfa_session_with_ip(
  p_session_token TEXT,
  p_ip_address TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_record RECORD;
BEGIN
  SELECT 
    id, 
    ip_address, 
    expires_at,
    skip_validation_for_ip
  INTO session_record
  FROM public.mfa_sessions
  WHERE session_token = p_session_token
    AND user_id = auth.uid()
    AND expires_at > now()
  LIMIT 1;
  
  -- No session found
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- If IP validation is enabled and IPs don't match, invalidate
  IF NOT session_record.skip_validation_for_ip 
     AND session_record.ip_address != p_ip_address THEN
    RETURN false;
  END IF;
  
  -- Session valid
  RETURN true;
END;
$$;

-- Phase 2: Entity Management System
-- Master entities table (replaces ENTITIES constant)
CREATE TABLE IF NOT EXISTS public.system_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  emoji TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Audit trail for entity changes
CREATE TABLE IF NOT EXISTS public.entity_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID REFERENCES public.system_entities(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.system_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_change_log ENABLE ROW LEVEL SECURITY;

-- Everyone can read active entities
CREATE POLICY "Anyone can view active entities"
  ON public.system_entities
  FOR SELECT
  USING (is_active = true OR auth.uid() IS NOT NULL);

-- Only admins can modify
CREATE POLICY "Admins can manage entities"
  ON public.system_entities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Everyone can read audit log (transparency)
CREATE POLICY "Anyone can view entity change log"
  ON public.entity_change_log
  FOR SELECT
  USING (true);

-- Trigger to log changes
CREATE OR REPLACE FUNCTION log_entity_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO entity_change_log (entity_id, action, new_value, changed_by)
    VALUES (NEW.id, 'created', to_jsonb(NEW), auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO entity_change_log (entity_id, action, old_value, new_value, changed_by)
    VALUES (NEW.id, 'updated', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO entity_change_log (entity_id, action, old_value, changed_by)
    VALUES (OLD.id, 'deleted', to_jsonb(OLD), auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_entity_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.system_entities
  FOR EACH ROW EXECUTE FUNCTION log_entity_changes();

-- Auto-insert current entities
INSERT INTO public.system_entities (name, code, emoji, display_order) VALUES
  ('Global Management', 'global_management', '🌍', 1),
  ('Jordan', 'jordan', '🇯🇴', 2),
  ('UAE', 'uae', '🇦🇪', 3),
  ('Lebanon', 'lebanon', '🇱🇧', 4),
  ('Kuwait', 'kuwait', '🇰🇼', 5),
  ('Iraq', 'iraq', '🇮🇶', 6),
  ('UK', 'uk', '🇬🇧', 7),
  ('Nigeria', 'nigeria', '🇳🇬', 8),
  ('Qatar', 'qatar', '🇶🇦', 9),
  ('India', 'india', '🇮🇳', 10),
  ('South Africa', 'south_africa', '🇿🇦', 11),
  ('Egypt', 'egypt', '🇪🇬', 12),
  ('Malaysia', 'malaysia', '🇲🇾', 13),
  ('Chile', 'chile', '🇨🇱', 14),
  ('Vietnam', 'vietnam', '🇻🇳', 15),
  ('Bahrain', 'bahrain', '🇧🇭', 16),
  ('Palestine', 'palestine', '🇵🇸', 17),
  ('Azerbaijan', 'azerbaijan', '🇦🇿', 18),
  ('Seychelles', 'seychelles', '🇸🇨', 19),
  ('Mauritius', 'mauritius', '🇲🇺', 20),
  ('Vanuatu', 'vanuatu', '🇻🇺', 21)
ON CONFLICT (name) DO NOTHING;