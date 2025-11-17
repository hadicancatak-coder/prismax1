-- Add entity and initial_comments columns to compliance_requests table
ALTER TABLE compliance_requests 
ADD COLUMN entity TEXT,
ADD COLUMN initial_comments TEXT;