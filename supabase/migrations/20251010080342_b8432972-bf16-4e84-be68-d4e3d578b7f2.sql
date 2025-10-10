-- Fix duplicate roles issue - keep only admin role if user has both
DELETE FROM public.user_roles
WHERE id IN (
  SELECT id FROM (
    SELECT id, role, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY 
      CASE WHEN role = 'admin' THEN 1 ELSE 2 END, created_at DESC
    ) as rn
    FROM public.user_roles
  ) t
  WHERE t.rn > 1
);

-- Drop old constraint if exists
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Add unique constraint on user_id only (one role per user)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_roles_user_id_unique'
  ) THEN
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);
  END IF;
END $$;