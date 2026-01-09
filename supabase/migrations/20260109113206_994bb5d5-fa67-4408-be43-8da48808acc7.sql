-- Phase 4: Supprimer les politiques RLS conflictuelles

-- 1. site_settings - Supprimer la politique trop permissive qui expose les settings sensibles
DROP POLICY IF EXISTS "Public read access to site_settings" ON site_settings;

-- 2. newsletter_subscribers - Supprimer la politique qui permet aux poster_actualite de voir les emails
DROP POLICY IF EXISTS "Authorized users can view newsletter subscribers" ON newsletter_subscribers;

-- 3. leads - Supprimer la politique WITH CHECK (true) trop permissive
DROP POLICY IF EXISTS "Authenticated users can create leads" ON leads;