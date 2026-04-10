-- Add regional_content JSONB column to landing_pages
ALTER TABLE public.landing_pages
ADD COLUMN regional_content jsonb DEFAULT '{}'::jsonb;

-- Delete panneaux-photovoltaiques variants (duplicates of the base solar LP)
DELETE FROM public.landing_pages
WHERE variant_slug = 'panneaux-photovoltaiques';