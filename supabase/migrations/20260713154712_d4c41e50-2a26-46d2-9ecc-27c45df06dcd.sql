
-- 1) Table de tracking anti-abus pour edge functions publiques
CREATE TABLE IF NOT EXISTS public.edge_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,          -- typiquement une IP
  endpoint TEXT NOT NULL,            -- nom de la fonction
  called_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edge_rate_limits_lookup
  ON public.edge_rate_limits (identifier, endpoint, called_at DESC);

-- Aucun grant anon/authenticated : n'est manipulé qu'en service_role via les RPC.
GRANT ALL ON public.edge_rate_limits TO service_role;

ALTER TABLE public.edge_rate_limits ENABLE ROW LEVEL SECURITY;

-- Politique minimale : personne n'accède directement, seulement via SECURITY DEFINER
CREATE POLICY "edge_rate_limits service only"
  ON public.edge_rate_limits FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 2) Vérifie la fenêtre glissante 1h (générique)
CREATE OR REPLACE FUNCTION public.check_edge_rate(
  p_identifier text,
  p_endpoint text,
  p_max_per_hour integer DEFAULT 10
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Sans identifiant, on autorise (fallback) — l'edge function loggera le cas
  IF p_identifier IS NULL OR p_identifier = '' THEN
    RETURN true;
  END IF;

  -- Nettoyage opportuniste des vieux enregistrements (> 24h)
  DELETE FROM public.edge_rate_limits
  WHERE called_at < now() - INTERVAL '24 hours';

  SELECT COUNT(*) INTO recent_count
  FROM public.edge_rate_limits
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND called_at > now() - INTERVAL '1 hour';

  RETURN recent_count < p_max_per_hour;
END;
$$;

-- 3) Enregistre un appel
CREATE OR REPLACE FUNCTION public.record_edge_call(
  p_identifier text,
  p_endpoint text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_identifier IS NULL OR p_identifier = '' THEN
    RETURN;
  END IF;
  INSERT INTO public.edge_rate_limits (identifier, endpoint)
  VALUES (p_identifier, p_endpoint);
END;
$$;

-- 4) Accès EXECUTE réservé au service_role
REVOKE EXECUTE ON FUNCTION public.check_edge_rate(text, text, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_edge_call(text, text) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_edge_rate(text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_edge_call(text, text) TO service_role;
