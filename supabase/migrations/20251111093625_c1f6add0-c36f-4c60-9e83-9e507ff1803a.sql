-- Drop and recreate location_type enum with all 31 new types
-- First, create a temporary type with all new values
CREATE TYPE location_type_new AS ENUM (
  -- Iconic / Landmark Assets
  'Airport Media', 'LED Tower', '3D Digital Vessel', 'Building Wrap',
  'Iconic Art (Station Wrap)', 'Station Wrap (Generic)',
  
  -- Premium Large-Format Roadside
  'Digital Unipole', 'LED Unipole', 'Megacom', 'Megacom Board',
  'Hoarding', 'TPS / Hoarding',
  
  -- Bridges & Gateways
  'Bridge', 'Bridge Banner', 'Static Bridge Banner',
  
  -- Urban Digital Screens
  'LED Screen', 'Digital Screen', 'Destination Display',
  'Light Box', 'Vertical Light Box', 'Piers (Backlit Lightbox)',
  
  -- Street Furniture
  'Lamppost', 'Mupi', 'Mupi Board', 'Mupi Digital', 'Bus Shelter',
  
  -- Transit / Metro
  'Metro Pillars (Backlit Lightbox)',
  
  -- Retail & Indoor Media
  'In-Mall Screen', 'Elevator Screen',
  
  -- Glass & Wall Treatments
  'Wall Banner', 'Glass Wrap'
);

-- Update the column to use the new type (with safe defaults for unmapped old types)
ALTER TABLE media_locations 
  ALTER COLUMN type TYPE location_type_new 
  USING CASE 
    WHEN type::text = 'LED' THEN 'LED Screen'
    WHEN type::text = 'Hoardings' THEN 'Hoarding'
    WHEN type::text = 'Wall Wraps' THEN 'Wall Banner'
    WHEN type::text = 'Lampposts' THEN 'Lamppost'
    WHEN type::text = 'Mupis' THEN 'Mupi'
    WHEN type::text = 'Airport' THEN 'Airport Media'
    WHEN type::text = 'In-Mall Media' THEN 'In-Mall Screen'
    WHEN type::text = 'Billboard' THEN 'Hoarding'
    WHEN type::text = 'Transit' THEN 'Metro Pillars (Backlit Lightbox)'
    WHEN type::text = 'Street Furniture' THEN 'Bus Shelter'
    WHEN type::text = 'Unipoles/Megacorns' THEN 'Megacom'
    WHEN type::text = 'Roof Top Screens' THEN 'LED Screen'
    WHEN type::text = 'Tram' THEN 'Metro Pillars (Backlit Lightbox)'
    WHEN type::text = 'Metro' THEN 'Metro Pillars (Backlit Lightbox)'
    WHEN type::text = 'Elevator Screen' THEN 'Elevator Screen'
    WHEN type::text = 'Digital Screen' THEN 'Digital Screen'
    WHEN type::text = 'Bus Shelter' THEN 'Bus Shelter'
    ELSE 'Hoarding'::location_type_new
  END;

-- Drop old type and rename new type
DROP TYPE location_type;
ALTER TYPE location_type_new RENAME TO location_type;