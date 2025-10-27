-- Add quarterly_kpis field to profiles table
-- Store KPIs as JSONB arrays with structure: {id, description, weight, timeline}
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS quarterly_kpis JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN profiles.quarterly_kpis IS 'Quarterly KPIs with weights and timelines stored as JSONB array';