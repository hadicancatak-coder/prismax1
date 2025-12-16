-- Add new fields to tech_stack_pages
ALTER TABLE public.tech_stack_pages
ADD COLUMN integrated_at date,
ADD COLUMN status text DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'planned', 'under_review')),
ADD COLUMN owner_id uuid REFERENCES public.profiles(id);