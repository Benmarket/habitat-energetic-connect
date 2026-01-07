-- Table pour les bandeaux CTA (modèles réutilisables)
CREATE TABLE public.cta_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Style du bandeau
  template_style VARCHAR(50) NOT NULL DEFAULT 'wave', -- wave, geometric, gradient, minimal
  background_color VARCHAR(7) DEFAULT '#10b981',
  secondary_color VARCHAR(7) DEFAULT '#059669',
  text_color VARCHAR(7) DEFAULT '#ffffff',
  accent_color VARCHAR(7) DEFAULT '#fbbf24',
  
  -- Contenu
  title VARCHAR(255) NOT NULL,
  subtitle TEXT,
  
  -- Favoris
  is_favorite BOOLEAN DEFAULT false,
  favorite_order INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cta_banners ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own cta_banners" 
ON public.cta_banners 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cta_banners" 
ON public.cta_banners 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cta_banners" 
ON public.cta_banners 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cta_banners" 
ON public.cta_banners 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_cta_banners_updated_at
BEFORE UPDATE ON public.cta_banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Ajouter colonne template_colors à la table posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS template_colors JSONB DEFAULT NULL;

-- Index pour améliorer les performances
CREATE INDEX idx_cta_banners_user_id ON public.cta_banners(user_id);
CREATE INDEX idx_cta_banners_is_favorite ON public.cta_banners(is_favorite);
CREATE INDEX idx_posts_template_colors ON public.posts USING GIN(template_colors);