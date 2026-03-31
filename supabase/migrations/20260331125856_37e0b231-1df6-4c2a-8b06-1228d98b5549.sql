
-- Add hierarchical columns to landing_pages
ALTER TABLE public.landing_pages 
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS region_code text,
  ADD COLUMN IF NOT EXISTS variant_slug text,
  ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'product';

-- Index for fast child lookups
CREATE INDEX IF NOT EXISTS idx_landing_pages_parent_id ON public.landing_pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_level ON public.landing_pages(level);
