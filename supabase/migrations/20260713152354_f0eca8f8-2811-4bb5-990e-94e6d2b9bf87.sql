-- Retire l'accès public en lecture à la table form_configurations (contient webhook_url).
-- Les lectures publiques passent désormais exclusivement par la vue form_configurations_public.
DROP POLICY IF EXISTS "Public can view form configurations without sensitive data" ON public.form_configurations;

-- Révoque tout accès direct anon/authenticated sur la table. Seuls les admins (via la policy ALL restante)
-- et le service_role peuvent la lire/écrire.
REVOKE SELECT ON public.form_configurations FROM anon, authenticated;

-- S'assure que la vue publique reste lisible par tous.
GRANT SELECT ON public.form_configurations_public TO anon, authenticated;