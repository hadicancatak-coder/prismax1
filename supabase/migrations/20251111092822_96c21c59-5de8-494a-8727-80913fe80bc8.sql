-- Add all new location types to the enum
ALTER TYPE location_type ADD VALUE IF NOT EXISTS 'LED';
ALTER TYPE location_type ADD VALUE IF NOT EXISTS 'Digital Screen';
ALTER TYPE location_type ADD VALUE IF NOT EXISTS 'Unipoles/Megacorns';
ALTER TYPE location_type ADD VALUE IF NOT EXISTS 'Lampposts';
ALTER TYPE location_type ADD VALUE IF NOT EXISTS 'Mupis';
ALTER TYPE location_type ADD VALUE IF NOT EXISTS 'In-Mall Media';
ALTER TYPE location_type ADD VALUE IF NOT EXISTS 'Hoardings';
ALTER TYPE location_type ADD VALUE IF NOT EXISTS 'Wall Wraps';
ALTER TYPE location_type ADD VALUE IF NOT EXISTS 'Roof Top Screens';
ALTER TYPE location_type ADD VALUE IF NOT EXISTS 'Airport';
ALTER TYPE location_type ADD VALUE IF NOT EXISTS 'Tram';
ALTER TYPE location_type ADD VALUE IF NOT EXISTS 'Metro';
ALTER TYPE location_type ADD VALUE IF NOT EXISTS 'Elevator Screen';

-- Update existing locations with sample prices if they don't have one
UPDATE media_locations 
SET price_per_month = FLOOR(RANDOM() * 10000 + 5000)::numeric
WHERE price_per_month IS NULL;