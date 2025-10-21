-- Add missing foreign key constraints for approvals system

-- Add foreign key for task_change_requests.decided_by if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_change_requests_decided_by_fkey' 
        AND table_name = 'task_change_requests'
    ) THEN
        ALTER TABLE public.task_change_requests
        ADD CONSTRAINT task_change_requests_decided_by_fkey
        FOREIGN KEY (decided_by) 
        REFERENCES public.profiles(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key for ads.created_by if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ads_created_by_fkey' 
        AND table_name = 'ads'
    ) THEN
        ALTER TABLE public.ads
        ADD CONSTRAINT ads_created_by_fkey
        FOREIGN KEY (created_by) 
        REFERENCES public.profiles(id) 
        ON DELETE CASCADE;
    END IF;
END $$;