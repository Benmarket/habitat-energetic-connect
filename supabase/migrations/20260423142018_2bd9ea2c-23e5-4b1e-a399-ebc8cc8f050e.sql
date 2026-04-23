DROP POLICY IF EXISTS "Public read access for email-assets" ON storage.objects;

-- Lecture publique fichier par fichier (téléchargement direct via URL publique),
-- mais pas de listing du bucket. On exige que le path contienne au moins un segment.
CREATE POLICY "Public download access for email-assets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'email-assets'
  AND name IS NOT NULL
  AND length(name) > 0
);