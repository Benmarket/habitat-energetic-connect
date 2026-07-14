-- Restaurer les GRANTs (RLS filtre déjà par rôle admin)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_configurations TO authenticated;
GRANT ALL ON public.form_configurations TO service_role;

-- Vue publique consommée par le front (sans webhook_url)
GRANT SELECT ON public.form_configurations_public TO anon, authenticated;
GRANT ALL ON public.form_configurations_public TO service_role;