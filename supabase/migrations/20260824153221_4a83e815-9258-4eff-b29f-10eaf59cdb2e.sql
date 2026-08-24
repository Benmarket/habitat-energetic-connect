-- Rétablit l'enregistrement des vues de pages pour les visiteurs non connectés,
-- tout en gardant l'anti-abus (100 vues / heure / visiteur).
CREATE OR REPLACE FUNCTION public.check_page_view_rate(p_visitor_id text, p_ip text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(p_visitor_id, '') <> ''
     AND (SELECT count(*) FROM public.page_views
          WHERE visitor_id = p_visitor_id
            AND created_at > now() - interval '1 hour') < 100;
$$;

REVOKE EXECUTE ON FUNCTION public.check_page_view_rate(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_page_view_rate(text, text) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Rate limited page views insertion" ON public.page_views;
CREATE POLICY "Rate limited page views insertion"
ON public.page_views
FOR INSERT
TO anon, authenticated
WITH CHECK (public.check_page_view_rate(visitor_id, NULL::text));

GRANT INSERT ON public.page_views TO anon, authenticated;
GRANT ALL ON public.page_views TO service_role;