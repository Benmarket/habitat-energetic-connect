-- Créer une table pour les paramètres du site
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Politique pour lire les paramètres (tous les utilisateurs authentifiés)
CREATE POLICY "Anyone can view site settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (true);

-- Politique pour modifier les paramètres (seulement les admins)
CREATE POLICY "Only admins can update site settings"
ON public.site_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  )
);

-- Insérer le paramètre de maintenance par défaut
INSERT INTO public.site_settings (key, value)
VALUES ('maintenance_mode', '{"enabled": false, "message": "Site en maintenance. Nous reviendrons bientôt!"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_site_settings_updated_at();