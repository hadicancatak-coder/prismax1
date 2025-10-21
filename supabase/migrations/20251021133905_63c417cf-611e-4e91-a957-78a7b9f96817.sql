-- Add foreign key constraints for approval_history table

-- Add foreign key for approval_history.requester_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'approval_history_requester_id_fkey' 
        AND table_name = 'approval_history'
    ) THEN
        -- First clean up any orphaned records
        DELETE FROM approval_history 
        WHERE requester_id IS NOT NULL 
        AND requester_id NOT IN (SELECT id FROM profiles);
        
        ALTER TABLE public.approval_history
        ADD CONSTRAINT approval_history_requester_id_fkey
        FOREIGN KEY (requester_id) 
        REFERENCES public.profiles(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key for approval_history.approver_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'approval_history_approver_id_fkey' 
        AND table_name = 'approval_history'
    ) THEN
        -- First clean up any orphaned records
        DELETE FROM approval_history 
        WHERE approver_id IS NOT NULL 
        AND approver_id NOT IN (SELECT id FROM profiles);
        
        ALTER TABLE public.approval_history
        ADD CONSTRAINT approval_history_approver_id_fkey
        FOREIGN KEY (approver_id) 
        REFERENCES public.profiles(id) 
        ON DELETE SET NULL;
    END IF;
END $$;