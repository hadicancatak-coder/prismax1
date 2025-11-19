-- Fix storage RLS policy to allow all authenticated users to upload campaign images
DROP POLICY IF EXISTS "Only admins can upload campaign images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload campaign images" ON storage.objects;

-- Create new policy for all authenticated users to upload
CREATE POLICY "Authenticated users can upload campaign images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign-images');

-- Allow authenticated users to read campaign images
CREATE POLICY "Campaign images are publicly viewable"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'campaign-images');

-- Allow users to update their own uploads
CREATE POLICY "Users can update campaign images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'campaign-images');