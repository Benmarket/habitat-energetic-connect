
ALTER TABLE public.guide_downloads
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS popup_id uuid,
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS user_agent text;

CREATE INDEX IF NOT EXISTS idx_guide_downloads_guide_id ON public.guide_downloads(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_downloads_created_at ON public.guide_downloads(created_at DESC);
