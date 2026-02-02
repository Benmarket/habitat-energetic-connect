
-- ============================================
-- POINT 1: Verrouillage contenu membres-only
-- ============================================

-- Supprimer l'ancienne policy publique sur posts
DROP POLICY IF EXISTS "Anyone can view published posts" ON public.posts;

-- Recréer avec condition is_members_only
CREATE POLICY "Anyone can view published public posts" 
ON public.posts 
FOR SELECT 
USING (
  status = 'published' 
  AND (is_members_only = false OR is_members_only IS NULL)
);

-- Policy pour les membres authentifiés (peuvent voir tout le contenu published)
CREATE POLICY "Authenticated users can view all published posts" 
ON public.posts 
FOR SELECT 
TO authenticated
USING (status = 'published');

-- ============================================
-- POINT 3 & 5: Rate-limiting page_views et ad_analytics
-- ============================================

-- Fonction de rate-limiting pour page_views (max 100 par IP par heure)
CREATE OR REPLACE FUNCTION public.check_page_view_rate(p_visitor_id text, p_ip text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Si pas d'identifiant, on autorise mais avec prudence
  IF (p_visitor_id IS NULL OR p_visitor_id = '') AND (p_ip IS NULL OR p_ip = '') THEN
    RETURN true;
  END IF;
  
  -- Compter les page views récentes de ce visiteur/IP
  SELECT COUNT(*) INTO recent_count
  FROM page_views
  WHERE (visitor_id = p_visitor_id OR (p_ip IS NOT NULL AND user_agent LIKE '%' || p_ip || '%'))
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Autoriser si moins de 100 vues par heure
  RETURN recent_count < 100;
END;
$$;

-- Fonction de rate-limiting pour ad_analytics (max 50 par visitor par heure)
CREATE OR REPLACE FUNCTION public.check_ad_analytics_rate(p_visitor_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  IF p_visitor_id IS NULL OR p_visitor_id = '' THEN
    RETURN true;
  END IF;
  
  SELECT COUNT(*) INTO recent_count
  FROM ad_analytics
  WHERE visitor_id = p_visitor_id
    AND created_at > NOW() - INTERVAL '1 hour';
  
  RETURN recent_count < 50;
END;
$$;

-- Remplacer les policies trop permissives
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Rate limited page views insertion" 
ON public.page_views 
FOR INSERT 
WITH CHECK (check_page_view_rate(visitor_id, NULL));

DROP POLICY IF EXISTS "Anyone can insert ad analytics" ON public.ad_analytics;
CREATE POLICY "Rate limited ad analytics insertion" 
ON public.ad_analytics 
FOR INSERT 
WITH CHECK (check_ad_analytics_rate(visitor_id));

-- ============================================
-- Fonction de rate-limiting pour generate-article (stockage compteur)
-- ============================================

-- Table pour tracker les appels API IA par utilisateur
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  called_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index pour requêtes rapides
CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_user_endpoint 
ON public.ai_rate_limits(user_id, endpoint, called_at);

-- Activer RLS
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policy: seuls les admins peuvent lire, le serveur peut insérer via service_role
CREATE POLICY "Admins can view ai rate limits"
ON public.ai_rate_limits
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Fonction pour vérifier le rate limit IA
CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(p_user_id uuid, p_endpoint text, p_max_per_hour integer DEFAULT 10)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Nettoyer les vieilles entrées (> 24h)
  DELETE FROM ai_rate_limits 
  WHERE called_at < NOW() - INTERVAL '24 hours';
  
  -- Compter les appels récents
  SELECT COUNT(*) INTO recent_count
  FROM ai_rate_limits
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND called_at > NOW() - INTERVAL '1 hour';
  
  RETURN recent_count < p_max_per_hour;
END;
$$;

-- Fonction pour enregistrer un appel (appelée par l'edge function)
CREATE OR REPLACE FUNCTION public.record_ai_call(p_user_id uuid, p_endpoint text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO ai_rate_limits (user_id, endpoint, called_at)
  VALUES (p_user_id, p_endpoint, NOW());
END;
$$;
