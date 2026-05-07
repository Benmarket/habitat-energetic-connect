-- Restreindre le listing des buckets publics tout en gardant l'accès direct par URL
-- Les fichiers restent servis publiquement par le CDN Supabase via leur URL,
-- mais on empêche un client anon de lister/énumérer tous les fichiers via l'API.

-- MEDIA
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public read media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view media" ON storage.objects;
DROP POLICY IF EXISTS "Media public read" ON storage.objects;

CREATE POLICY "Admins can list media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'media'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
);

-- FORUM-IMAGES
DROP POLICY IF EXISTS "Public read forum images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view forum images" ON storage.objects;

CREATE POLICY "Admins can list forum images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'forum-images'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
);
