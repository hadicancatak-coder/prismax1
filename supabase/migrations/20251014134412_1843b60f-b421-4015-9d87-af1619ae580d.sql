-- Fix task_assignees foreign key to reference profiles.user_id instead of profiles.id
ALTER TABLE task_assignees 
DROP CONSTRAINT task_assignees_user_id_fkey;

ALTER TABLE task_assignees 
ADD CONSTRAINT task_assignees_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;