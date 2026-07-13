-- Restaurer la policy publique SELECT (nécessaire pour que la vue form_configurations_public fonctionne).
CREATE POLICY "Public can view non-sensitive form config"
  ON public.form_configurations
  FOR SELECT
  USING (true);

-- Grant column-level : tout SAUF webhook_url et webhook_enabled.
GRANT SELECT (
  id, name, form_identifier, description, fields_schema,
  send_confirmation_email, include_signup_link, created_at, updated_at
) ON public.form_configurations TO anon, authenticated;

-- Les admins gardent l'accès complet via service_role et via la policy "Admins can manage".
GRANT ALL ON public.form_configurations TO service_role;