
-- Drop overly broad SELECT policies on storage.objects that allow listing
DROP POLICY IF EXISTS "Public read access for media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view media files" ON storage.objects;

-- forum-images: check if there's a public select; drop any matching one defensively
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND cmd='SELECT'
      AND policyname ILIKE '%forum%' AND policyname NOT ILIKE '%admin%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;
