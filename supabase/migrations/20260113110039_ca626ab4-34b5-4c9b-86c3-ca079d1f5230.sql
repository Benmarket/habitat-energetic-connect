-- Table pour tracker les statistiques des annonces
CREATE TABLE public.ad_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertisement_id UUID NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'conversion')),
  region_code TEXT,
  visitor_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les requêtes de stats
CREATE INDEX idx_ad_analytics_advertisement_id ON public.ad_analytics(advertisement_id);
CREATE INDEX idx_ad_analytics_event_type ON public.ad_analytics(event_type);
CREATE INDEX idx_ad_analytics_created_at ON public.ad_analytics(created_at);
CREATE INDEX idx_ad_analytics_region_code ON public.ad_analytics(region_code);

-- Enable RLS
ALTER TABLE public.ad_analytics ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour les admins
CREATE POLICY "Admins can read ad analytics"
ON public.ad_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Politique d'insertion publique pour le tracking (anonymous users peuvent créer des events)
CREATE POLICY "Anyone can insert ad analytics"
ON public.ad_analytics
FOR INSERT
WITH CHECK (true);

-- Ajouter colonnes de cache pour les compteurs sur advertisements
ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicks_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversions_count INTEGER NOT NULL DEFAULT 0;

-- Activer realtime pour les analytics
ALTER PUBLICATION supabase_realtime ADD TABLE public.ad_analytics;