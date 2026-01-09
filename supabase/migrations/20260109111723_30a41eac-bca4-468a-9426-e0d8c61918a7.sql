-- =====================================================
-- MIGRATION SÉCURITÉ PHASE 3
-- 1. Rate limiting pour form_submissions, leads, newsletter_subscribers
-- 2. Protection site_settings avec is_public
-- 3. Masquage IP/User-Agent de forum_images pour non-admins
-- =====================================================

-- ===========================================
-- 1. RATE LIMITING POUR LES FORMULAIRES
-- ===========================================

-- Fonction de rate limiting pour les soumissions de formulaires
-- Limite : max 10 soumissions par IP par heure
CREATE OR REPLACE FUNCTION public.check_form_submission_rate(p_ip text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Si pas d'IP, on autorise (cas de fallback)
  IF p_ip IS NULL OR p_ip = '' THEN
    RETURN true;
  END IF;
  
  -- Compter les soumissions récentes de cette IP
  SELECT COUNT(*) INTO recent_count
  FROM form_submissions
  WHERE ip_address = p_ip
    AND submitted_at > NOW() - INTERVAL '1 hour';
  
  -- Autoriser si moins de 10 soumissions
  RETURN recent_count < 10;
END;
$$;

-- Fonction de rate limiting pour les leads
-- Limite : max 5 leads par IP par heure
CREATE OR REPLACE FUNCTION public.check_lead_rate(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Compter les leads récents avec cet email
  SELECT COUNT(*) INTO recent_count
  FROM leads
  WHERE email = p_email
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Autoriser si moins de 5 leads avec le même email
  RETURN recent_count < 5;
END;
$$;

-- Fonction de rate limiting pour newsletter
-- Limite : max 3 inscriptions par email par jour
CREATE OR REPLACE FUNCTION public.check_newsletter_rate(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM newsletter_subscribers
  WHERE email = p_email
    AND created_at > NOW() - INTERVAL '1 day';
  
  RETURN recent_count < 3;
END;
$$;

-- Mettre à jour les politiques RLS avec rate limiting

-- form_submissions : garder la politique mais ajouter rate limiting
DROP POLICY IF EXISTS "Anyone can submit forms" ON form_submissions;
CREATE POLICY "Rate limited form submissions" 
ON form_submissions FOR INSERT 
WITH CHECK (check_form_submission_rate(ip_address));

-- leads : rate limiting par email
DROP POLICY IF EXISTS "Anyone can create leads" ON leads;
CREATE POLICY "Rate limited lead creation" 
ON leads FOR INSERT 
WITH CHECK (check_lead_rate(email));

-- newsletter_subscribers : rate limiting par email
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;
CREATE POLICY "Rate limited newsletter subscription" 
ON newsletter_subscribers FOR INSERT 
WITH CHECK (check_newsletter_rate(email));

-- ===========================================
-- 2. PROTECTION SITE_SETTINGS
-- ===========================================

-- Ajouter la colonne is_public si elle n'existe pas
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- Marquer les settings sensibles comme privés
UPDATE site_settings SET is_public = false 
WHERE key IN ('ai_generation_api_url', 'ai_generation_model', 'ai_generation_enabled', 'ai_custom_instructions');

-- Mettre à jour la politique RLS pour site_settings
DROP POLICY IF EXISTS "Anyone can read site settings" ON site_settings;
DROP POLICY IF EXISTS "Public can view public settings" ON site_settings;

-- Nouvelle politique : les visiteurs ne voient que les settings publics
-- Les admins voient tout
CREATE POLICY "Public settings for everyone, all for admins" 
ON site_settings FOR SELECT 
USING (
  is_public = true 
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- ===========================================
-- 3. PROTECTION FORUM_IMAGES (IP/User-Agent)
-- ===========================================

-- Créer une vue sécurisée pour forum_images qui masque IP/UA
CREATE OR REPLACE VIEW public.forum_images_safe AS
SELECT 
  id,
  user_id,
  post_id,
  topic_id,
  storage_path,
  filename,
  mime_type,
  file_size,
  created_at,
  -- Masquer IP et User-Agent sauf pour les admins
  CASE 
    WHEN public.has_role(auth.uid(), 'admin'::app_role) 
      OR public.has_role(auth.uid(), 'super_admin'::app_role)
    THEN ip_address 
    ELSE NULL 
  END as ip_address,
  CASE 
    WHEN public.has_role(auth.uid(), 'admin'::app_role) 
      OR public.has_role(auth.uid(), 'super_admin'::app_role)
    THEN user_agent 
    ELSE NULL 
  END as user_agent
FROM forum_images;

-- ===========================================
-- 4. RESTREINDRE NEWSLETTER_SUBSCRIBERS AUX ADMINS
-- ===========================================

-- Seuls les admins peuvent voir les abonnés newsletter
DROP POLICY IF EXISTS "Anyone can view newsletter subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Authenticated users with role can view subscribers" ON newsletter_subscribers;

CREATE POLICY "Only admins can view newsletter subscribers" 
ON newsletter_subscribers FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- ===========================================
-- 5. CORRIGER SEARCH_PATH DES FONCTIONS
-- ===========================================

-- Recréer has_role avec search_path explicite (si pas déjà fait)
CREATE OR REPLACE FUNCTION public.has_role(_role app_role, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Recréer has_permission avec search_path explicite
CREATE OR REPLACE FUNCTION public.has_permission(_permission_code text, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = _user_id
      AND p.code = _permission_code
  )
$$;