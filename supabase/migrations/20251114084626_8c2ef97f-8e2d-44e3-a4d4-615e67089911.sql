-- Add helper function to increment board access count
CREATE OR REPLACE FUNCTION public.increment_board_access(
  p_user_id UUID,
  p_board_id UUID
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_board_access (user_id, board_id, last_accessed_at, access_count)
  VALUES (p_user_id, p_board_id, NOW(), 1)
  ON CONFLICT (user_id, board_id)
  DO UPDATE SET
    last_accessed_at = NOW(),
    access_count = user_board_access.access_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;