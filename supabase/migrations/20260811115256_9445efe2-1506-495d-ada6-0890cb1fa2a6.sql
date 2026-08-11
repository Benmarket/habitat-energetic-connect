ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS legacy_slug text;
CREATE UNIQUE INDEX IF NOT EXISTS posts_legacy_slug_key ON public.posts (legacy_slug) WHERE legacy_slug IS NOT NULL;