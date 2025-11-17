-- Step 1: Add new enum values (must commit before using them)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'generic' AND enumtypid = 'task_type'::regtype) THEN
    ALTER TYPE task_type ADD VALUE 'generic';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'campaign' AND enumtypid = 'task_type'::regtype) THEN
    ALTER TYPE task_type ADD VALUE 'campaign';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'recurring' AND enumtypid = 'task_type'::regtype) THEN
    ALTER TYPE task_type ADD VALUE 'recurring';
  END IF;
END $$;