-- Add socialua_update and ppc_update columns to status_logs table for Brief log type
ALTER TABLE public.status_logs 
ADD COLUMN socialua_update TEXT,
ADD COLUMN ppc_update TEXT;