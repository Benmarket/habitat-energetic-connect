-- 1. Add guide-specific columns to posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS guide_depth text,
  ADD COLUMN IF NOT EXISTS guide_level text,
  ADD COLUMN IF NOT EXISTS guide_duration text,
  ADD COLUMN IF NOT EXISTS guide_objective text,
  ADD COLUMN IF NOT EXISTS guide_options jsonb DEFAULT '{}'::jsonb;

-- 2. Create guide_downloads table
CREATE TABLE IF NOT EXISTS public.guide_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id uuid NOT NULL,
  guide_slug text,
  guide_title text,
  user_id uuid,
  email text NOT NULL,
  first_name text,
  last_name text,
  method text NOT NULL DEFAULT 'email',
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guide_downloads_method_check CHECK (method IN ('direct', 'email'))
);

CREATE INDEX IF NOT EXISTS idx_guide_downloads_guide_id ON public.guide_downloads(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_downloads_email ON public.guide_downloads(email);
CREATE INDEX IF NOT EXISTS idx_guide_downloads_created_at ON public.guide_downloads(created_at DESC);

ALTER TABLE public.guide_downloads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a download record (visitors & users)
CREATE POLICY "Anyone can record a guide download"
  ON public.guide_downloads
  FOR INSERT
  TO public
  WITH CHECK (email IS NOT NULL AND length(trim(email)) > 0);

-- Only admins can read
CREATE POLICY "Admins can view all guide downloads"
  ON public.guide_downloads
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- No update / no delete (audit immuable)
CREATE POLICY "No updates on guide_downloads"
  ON public.guide_downloads
  FOR UPDATE
  TO public
  USING (false);

CREATE POLICY "No deletes on guide_downloads"
  ON public.guide_downloads
  FOR DELETE
  TO public
  USING (false);