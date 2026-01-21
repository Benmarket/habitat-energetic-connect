-- Add certification fields to advertisements table
ALTER TABLE public.advertisements 
ADD COLUMN is_rge_certified boolean NOT NULL DEFAULT false,
ADD COLUMN rge_certification_text text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.advertisements.is_rge_certified IS 'Whether the advertiser is RGE certified for this offer';
COMMENT ON COLUMN public.advertisements.rge_certification_text IS 'Custom RGE certification text, e.g. "QualiPV 2026"';