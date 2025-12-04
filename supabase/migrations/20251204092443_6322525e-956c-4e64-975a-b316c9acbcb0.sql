-- Create user_agenda table for managing personal agenda items
CREATE TABLE public.user_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  agenda_date DATE NOT NULL,
  is_auto_added BOOLEAN DEFAULT false,
  added_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, task_id, agenda_date)
);

-- Create indexes for performance
CREATE INDEX idx_user_agenda_user_date ON public.user_agenda(user_id, agenda_date);
CREATE INDEX idx_user_agenda_task ON public.user_agenda(task_id);

-- Enable RLS
ALTER TABLE public.user_agenda ENABLE ROW LEVEL SECURITY;

-- Users can view their own agenda
CREATE POLICY "Users can view own agenda" ON public.user_agenda
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert to their own agenda
CREATE POLICY "Users can add to own agenda" ON public.user_agenda
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete from their own agenda
CREATE POLICY "Users can remove from own agenda" ON public.user_agenda
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all agendas
CREATE POLICY "Admins can view all agendas" ON public.user_agenda
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));