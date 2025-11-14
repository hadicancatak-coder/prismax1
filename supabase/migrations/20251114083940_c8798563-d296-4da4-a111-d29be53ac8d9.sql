-- Phase 1: Core Infrastructure Tables
-- These tables add metadata for UI organization without touching existing data

-- Workspaces (organize pages/boards)
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Everyone can view workspaces
CREATE POLICY "Workspaces are viewable by everyone"
ON public.workspaces FOR SELECT
USING (true);

-- Board/Page metadata (connects routes to workspaces)
CREATE TABLE public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  route TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Everyone can view boards
CREATE POLICY "Boards are viewable by everyone"
ON public.boards FOR SELECT
USING (true);

-- User board preferences (starred, recently viewed)
CREATE TABLE public.user_board_access (
  user_id UUID NOT NULL,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
  is_starred BOOLEAN DEFAULT false,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, board_id)
);

-- Enable RLS
ALTER TABLE public.user_board_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view their own board access"
ON public.user_board_access FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own board access"
ON public.user_board_access FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own board access"
ON public.user_board_access FOR UPDATE
USING (auth.uid() = user_id);

-- Templates (pre-built workflows)
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  preview_image_url TEXT,
  template_data JSONB,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Everyone can view public templates
CREATE POLICY "Public templates are viewable by everyone"
ON public.templates FOR SELECT
USING (is_public = true);

-- Search index (for global search)
CREATE TABLE public.search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  metadata JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  search_vector TSVECTOR
);

-- Enable RLS
ALTER TABLE public.search_index ENABLE ROW LEVEL SECURITY;

-- Everyone can search
CREATE POLICY "Search index is viewable by everyone"
ON public.search_index FOR SELECT
USING (true);

-- Create full-text search index
CREATE INDEX search_index_search_vector_idx ON public.search_index USING GIN(search_vector);

-- Create index on entity type and ID for faster lookups
CREATE INDEX search_index_entity_idx ON public.search_index(entity_type, entity_id);

-- Function to update search vector automatically
CREATE OR REPLACE FUNCTION public.update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update search vector
CREATE TRIGGER update_search_index_vector
BEFORE INSERT OR UPDATE ON public.search_index
FOR EACH ROW
EXECUTE FUNCTION public.update_search_vector();

-- Insert default workspaces
INSERT INTO public.workspaces (name, description, icon, color, sort_order) VALUES
('Ads & Marketing', 'Digital advertising and campaign management', 'Megaphone', '#3B82F6', 1),
('Operations', 'Operational workflows and reporting', 'Settings', '#8B5CF6', 2),
('Intelligence', 'Location and web intelligence data', 'Brain', '#10B981', 3),
('Admin', 'System administration and management', 'Shield', '#EF4444', 4);

-- Insert default boards (mapping existing routes)
INSERT INTO public.boards (workspace_id, name, description, route, icon, sort_order)
SELECT 
  w.id,
  b.name,
  b.description,
  b.route,
  b.icon,
  b.sort_order
FROM public.workspaces w
CROSS JOIN LATERAL (
  VALUES
    -- Ads & Marketing workspace
    ('Search Planner', 'Plan and manage search campaigns', '/ads/search', 'Search', 1),
    ('Display Planner', 'Create and organize display advertisements', '/ads/display', 'Monitor', 2),
    ('Copy Writer', 'Manage ad copy and creative content', '/copywriter', 'FileText', 3),
    ('UTM Planner', 'Build and track UTM campaign links', '/utm', 'Link', 4),
    ('Saved Elements', 'Library of saved ad elements', '/ads/saved-elements', 'Save', 5)
) b(name, description, route, icon, sort_order)
WHERE w.name = 'Ads & Marketing'

UNION ALL

SELECT 
  w.id,
  b.name,
  b.description,
  b.route,
  b.icon,
  b.sort_order
FROM public.workspaces w
CROSS JOIN LATERAL (
  VALUES
    ('Audit Logs', 'Operation audit and compliance logs', '/operations', 'ClipboardList', 1),
    ('Status Log', 'Team status updates and activity', '/status-log', 'Activity', 2),
    ('Custom Reports', 'Build custom reports and analytics', '/operations/reports', 'BarChart3', 3)
) b(name, description, route, icon, sort_order)
WHERE w.name = 'Operations'

UNION ALL

SELECT 
  w.id,
  b.name,
  b.description,
  b.route,
  b.icon,
  b.sort_order
FROM public.workspaces w
CROSS JOIN LATERAL (
  VALUES
    ('Location Intel', 'Geographic location intelligence', '/location-intel', 'MapPin', 1),
    ('Web Intel', 'Website intelligence and tracking', '/web-intel', 'Globe', 2)
) b(name, description, route, icon, sort_order)
WHERE w.name = 'Intelligence'

UNION ALL

SELECT 
  w.id,
  b.name,
  b.description,
  b.route,
  b.icon,
  b.sort_order
FROM public.workspaces w
CROSS JOIN LATERAL (
  VALUES
    ('Overview', 'System overview and analytics', '/admin', 'LayoutDashboard', 1),
    ('Users', 'User management', '/admin/users', 'Users', 2),
    ('Selectors', 'System selectors management', '/admin/selectors', 'ListFilter', 3),
    ('KPIs', 'Key performance indicators', '/admin/kpis', 'Target', 4),
    ('Approvals', 'Approval workflows', '/admin/approvals', 'CheckCircle', 5),
    ('Errors', 'System error logs', '/admin/errors', 'AlertTriangle', 6),
    ('Activity', 'System activity log', '/admin/audit-log', 'FileText', 7),
    ('Security', 'Security scans and settings', '/admin/security', 'Shield', 8)
) b(name, description, route, icon, sort_order)
WHERE w.name = 'Admin';