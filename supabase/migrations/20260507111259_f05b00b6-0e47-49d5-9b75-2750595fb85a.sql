-- Restaurer l'accès public en lecture aux buckets publics
DROP POLICY IF EXISTS "Admins can list media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can list forum images" ON storage.objects;

CREATE POLICY "Public read media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

CREATE POLICY "Public read forum images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'forum-images');

CREATE POLICY "Public read email assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'email-assets');
