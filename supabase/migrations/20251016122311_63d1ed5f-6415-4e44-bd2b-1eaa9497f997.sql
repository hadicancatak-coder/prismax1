-- Document new element types for display ads
-- New element types: 'business_name', 'long_headline', 'cta'
-- Existing types: 'headline', 'description', 'sitelink', 'callout'
COMMENT ON COLUMN ad_elements.element_type IS 'Types: headline, description, sitelink, callout, business_name, long_headline, cta';