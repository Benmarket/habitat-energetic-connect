-- Les visiteurs anonymes peuvent enregistrer une visite (insert seul, sans relecture)
-- et compléter la durée de lecture de leur visite récente, uniquement sur cette colonne.
REVOKE UPDATE, SELECT, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.page_views FROM anon;
REVOKE UPDATE, SELECT, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.page_views FROM authenticated;

GRANT INSERT ON public.page_views TO anon, authenticated;
GRANT UPDATE (duration_seconds) ON public.page_views TO anon, authenticated;
GRANT SELECT ON public.page_views TO authenticated; -- lecture filtrée par la policy admin

DROP POLICY IF EXISTS "Visitors can complete their page view duration" ON public.page_views;
CREATE POLICY "Visitors can complete their page view duration"
ON public.page_views
FOR UPDATE
TO anon, authenticated
USING (created_at > now() - interval '2 hours')
WITH CHECK (created_at > now() - interval '2 hours');