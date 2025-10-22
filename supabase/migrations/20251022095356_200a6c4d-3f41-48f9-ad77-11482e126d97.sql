-- Fix foreign key constraints to reference auth.users.id instead of profiles.id
-- This fixes the data type mismatch causing approvals errors and ads deletion

-- Fix ads.created_by foreign key
ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_created_by_fkey;
ALTER TABLE ads ADD CONSTRAINT ads_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Fix approval_history.requester_id foreign key
ALTER TABLE approval_history DROP CONSTRAINT IF EXISTS approval_history_requester_id_fkey;
ALTER TABLE approval_history ADD CONSTRAINT approval_history_requester_id_fkey 
FOREIGN KEY (requester_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix approval_history.approver_id foreign key
ALTER TABLE approval_history DROP CONSTRAINT IF EXISTS approval_history_approver_id_fkey;
ALTER TABLE approval_history ADD CONSTRAINT approval_history_approver_id_fkey 
FOREIGN KEY (approver_id) REFERENCES auth.users(id) ON DELETE SET NULL;