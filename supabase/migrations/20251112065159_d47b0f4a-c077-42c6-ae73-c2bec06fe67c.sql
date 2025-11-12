-- Create seminar_cities table
CREATE TABLE public.seminar_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  country TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seminar_cities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Cities viewable by authenticated users"
  ON public.seminar_cities FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage cities"
  ON public.seminar_cities FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index
CREATE INDEX idx_seminar_cities_active ON public.seminar_cities(is_active);
CREATE INDEX idx_seminar_cities_display_order ON public.seminar_cities(display_order);

-- Seed initial cities
INSERT INTO public.seminar_cities (name, country, display_order) VALUES
  ('Amman', 'Jordan', 0),
  ('Dubai', 'UAE', 1),
  ('Abu Dhabi', 'UAE', 2),
  ('Beirut', 'Lebanon', 3),
  ('Kuwait City', 'Kuwait', 4),
  ('Baghdad', 'Iraq', 5),
  ('London', 'UK', 6),
  ('Lagos', 'Nigeria', 7),
  ('Doha', 'Qatar', 8),
  ('Mumbai', 'India', 9),
  ('Johannesburg', 'South Africa', 10),
  ('Cairo', 'Egypt', 11),
  ('Kuala Lumpur', 'Malaysia', 12),
  ('Santiago', 'Chile', 13),
  ('Hanoi', 'Vietnam', 14);