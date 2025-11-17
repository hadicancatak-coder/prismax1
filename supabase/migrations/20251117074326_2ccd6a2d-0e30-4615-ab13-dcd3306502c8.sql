-- Add lp_type_id to landing_page_templates table
ALTER TABLE landing_page_templates 
ADD COLUMN IF NOT EXISTS lp_type_id uuid REFERENCES utm_lp_types(id);

-- Backfill existing templates by mapping purpose to LP type
UPDATE landing_page_templates lpt
SET lp_type_id = (
  SELECT id FROM utm_lp_types 
  WHERE name = CASE 
    WHEN lpt.purpose = 'AO' THEN 'Always On'
    WHEN lpt.purpose = 'Webinar' THEN 'Webinars'
    WHEN lpt.purpose = 'Seminar' THEN 'Seminar'
    WHEN lpt.purpose = 'Homepage' THEN 'Homepage'
    ELSE NULL
  END
  LIMIT 1
)
WHERE lp_type_id IS NULL;