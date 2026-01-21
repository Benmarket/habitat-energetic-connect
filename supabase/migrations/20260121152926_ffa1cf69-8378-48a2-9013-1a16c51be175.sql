-- Ajouter la colonne pour tracker les changements de statut SEO
ALTER TABLE public.landing_pages 
ADD COLUMN IF NOT EXISTS seo_status_changed_at TIMESTAMPTZ DEFAULT NOW();

-- Mettre à jour les lignes existantes avec la date actuelle
UPDATE public.landing_pages SET seo_status_changed_at = NOW() WHERE seo_status_changed_at IS NULL;

-- Créer la fonction pour mettre à jour automatiquement la date de changement
CREATE OR REPLACE FUNCTION public.update_seo_status_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.seo_status IS DISTINCT FROM NEW.seo_status THEN
    NEW.seo_status_changed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_seo_status_changed_at ON public.landing_pages;
CREATE TRIGGER trigger_update_seo_status_changed_at
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_seo_status_changed_at();