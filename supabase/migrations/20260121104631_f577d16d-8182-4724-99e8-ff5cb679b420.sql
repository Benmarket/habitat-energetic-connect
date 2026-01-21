-- Rendre le champ cta_url optionnel (nullable)
ALTER TABLE public.advertisements ALTER COLUMN cta_url DROP NOT NULL;

-- Mettre une valeur par défaut vide
ALTER TABLE public.advertisements ALTER COLUMN cta_url SET DEFAULT '';