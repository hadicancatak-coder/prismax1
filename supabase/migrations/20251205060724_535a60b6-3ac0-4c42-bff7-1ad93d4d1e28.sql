-- Add admin RLS policies for user_agenda table to allow admins to manage any user's agenda

-- Policy: Admins can insert agenda items for any user
CREATE POLICY "Admins can add to any agenda"
ON public.user_agenda
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can delete agenda items for any user
CREATE POLICY "Admins can remove from any agenda"
ON public.user_agenda
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can update agenda items for any user
CREATE POLICY "Admins can update any agenda"
ON public.user_agenda
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));