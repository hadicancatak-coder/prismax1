-- Update avatars bucket to be private (not public)
UPDATE storage.buckets
SET public = false
WHERE id = 'avatars';

-- Update campaigns bucket to be private (not public)
UPDATE storage.buckets
SET public = false
WHERE id = 'campaigns';

-- Drop existing public SELECT policies for both buckets
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Campaign images are publicly viewable" ON storage.objects;

-- Create authenticated-only SELECT policies for avatars
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

-- Create authenticated-only SELECT policies for campaigns
CREATE POLICY "Authenticated users can view campaigns"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'campaigns');