-- Clear force_password_reset flag for all users
UPDATE profiles 
SET force_password_reset = false;