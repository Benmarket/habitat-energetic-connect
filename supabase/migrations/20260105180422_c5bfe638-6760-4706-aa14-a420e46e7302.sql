-- Add product_type column to advertisements
ALTER TABLE public.advertisements 
ADD COLUMN product_type TEXT DEFAULT 'Solaire';

-- Update existing advertisements with appropriate product types based on title
UPDATE public.advertisements 
SET product_type = 'Pompe à chaleur' 
WHERE LOWER(title) LIKE '%pompe%' OR LOWER(title) LIKE '%chaleur%' OR LOWER(title) LIKE '%pac%';

UPDATE public.advertisements 
SET product_type = 'Isolation' 
WHERE LOWER(title) LIKE '%isolation%' OR LOWER(title) LIKE '%combles%' OR LOWER(title) LIKE '%murs%';

UPDATE public.advertisements 
SET product_type = 'Chaudière' 
WHERE LOWER(title) LIKE '%chaudière%' OR LOWER(title) LIKE '%chaudiére%';

UPDATE public.advertisements 
SET product_type = 'Fenêtres' 
WHERE LOWER(title) LIKE '%fenêtre%' OR LOWER(title) LIKE '%vitrage%';

-- Keep Solar as default for the rest (already set)
UPDATE public.advertisements 
SET product_type = 'Solaire' 
WHERE LOWER(title) LIKE '%solaire%' OR LOWER(title) LIKE '%panneaux%' OR LOWER(title) LIKE '%photovoltaïque%';

COMMENT ON COLUMN public.advertisements.product_type IS 'Type de travaux associé à l''annonce (Solaire, Pompe à chaleur, Isolation, etc.)';