-- Add sharing columns to knowledge_pages
ALTER TABLE public.knowledge_pages
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS public_token text DEFAULT encode(extensions.gen_random_bytes(16), 'hex');

-- Create unique index on public_token
CREATE UNIQUE INDEX IF NOT EXISTS knowledge_pages_public_token_idx ON public.knowledge_pages(public_token);

-- Add RLS policy for public access via token
CREATE POLICY "Public can view shared pages" 
ON public.knowledge_pages 
FOR SELECT 
USING (is_public = true AND public_token IS NOT NULL);

-- Allow anonymous users to read public pages
CREATE POLICY "Anonymous can view public pages"
ON public.knowledge_pages
FOR SELECT
TO anon
USING (is_public = true AND public_token IS NOT NULL);