-- Table de configuration des galeries d'images par type de produit pour les emails transactionnels.
-- Une seule ligne par work_type, avec exactement 3 slots ordonnés.
CREATE TABLE public.email_template_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_type text NOT NULL UNIQUE,
  image_1_url text,
  image_1_alt text,
  image_2_url text,
  image_2_alt text,
  image_3_url text,
  image_3_alt text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT email_template_gallery_work_type_check
    CHECK (work_type IN ('solaire', 'isolation', 'chauffage', 'renovation', 'mix', 'none'))
);

ALTER TABLE public.email_template_gallery ENABLE ROW LEVEL SECURITY;

-- Lecture publique : nécessaire car l'edge function admin-preview-emails et send-transactional-email
-- utilisent la clé service_role qui bypass RLS, mais on autorise aussi la lecture côté admin pour l'UI.
CREATE POLICY "Admins can read email gallery"
  ON public.email_template_gallery
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can insert email gallery"
  ON public.email_template_gallery
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can update email gallery"
  ON public.email_template_gallery
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete email gallery"
  ON public.email_template_gallery
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_email_template_gallery_updated_at
  BEFORE UPDATE ON public.email_template_gallery
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();