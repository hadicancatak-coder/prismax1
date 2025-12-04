-- Create CMS pages table for admin-editable content (About, How To)
CREATE TABLE public.cms_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  version TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

-- Everyone can read pages
CREATE POLICY "CMS pages are publicly readable"
ON public.cms_pages FOR SELECT
USING (true);

-- Only admins can update/insert
CREATE POLICY "Only admins can manage CMS pages"
ON public.cms_pages FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default pages
INSERT INTO public.cms_pages (slug, title, content, version) VALUES
('about', 'About Prisma', '## Version 2.0 – Current

### What''s New
- New Apple-quality UI system
- New KPI Management system
- Unified Caption Library
- Search Planner rebuild
- Agenda/Tasks stability improvements
- Bug fixes (RLS, ThemeProvider, etc.)

### How Prisma Works

**Tasks** - Manage your daily tasks with priority, due dates, and recurring patterns.

**Agenda** - Plan your day with auto-populated tasks based on due dates and priority.

**Captions** - Create and manage marketing copy with multi-language support.

**Search Planner** - Build Google Ads with live preview and quality scoring.

---

© 2025 Prisma. All rights reserved.', '2.0'),
('how-to', 'How to Use Prisma', '## Getting Started

### Tasks
1. Navigate to Tasks from the sidebar
2. Click "+ New Task" to create a task
3. Set priority, due date, and assign team members
4. Track progress through status updates

### Agenda
1. Open the Agenda page to see your daily plan
2. Tasks are auto-added based on due dates and priority
3. Drag and drop to reorder tasks
4. Check off tasks as you complete them

### Caption Library
1. Create captions for different platforms
2. Tag with entities and languages
3. Use "Save as Caption" in Search Planner to build your library
4. Insert saved captions into ads with "Use Caption"

### Search Planner
1. Select an entity and campaign
2. Create or edit ads with headlines and descriptions
3. Check the Quality Score panel for optimization tips
4. Save your work and track versions', '1.0');