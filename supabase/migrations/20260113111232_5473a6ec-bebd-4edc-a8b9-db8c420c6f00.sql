-- Table pour gérer les mises en avant d'annonces par région
-- Une annonce peut être mise en avant sur plusieurs régions
-- On garde max 3 annonces mises en avant par région
CREATE TABLE public.ad_region_featured (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertisement_id UUID NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  region_code TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Contrainte unique: une annonce ne peut être mise en avant qu'une fois par région
  UNIQUE(advertisement_id, region_code)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_ad_region_featured_region ON public.ad_region_featured(region_code);
CREATE INDEX idx_ad_region_featured_ad ON public.ad_region_featured(advertisement_id);

-- Enable RLS
ALTER TABLE public.ad_region_featured ENABLE ROW LEVEL SECURITY;

-- Policies: admins can manage, public can read
CREATE POLICY "Allow public read access to ad_region_featured"
  ON public.ad_region_featured FOR SELECT
  USING (true);

CREATE POLICY "Allow admin insert on ad_region_featured"
  ON public.ad_region_featured FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Allow admin update on ad_region_featured"
  ON public.ad_region_featured FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Allow admin delete on ad_region_featured"
  ON public.ad_region_featured FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );