
-- Create regions table
CREATE TABLE public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  image_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

-- Public read for regions
CREATE POLICY "Anyone can read active regions" ON public.regions
  FOR SELECT USING (is_active = true);

-- Admins can manage regions
CREATE POLICY "Admins can manage regions" ON public.regions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Add target_regions to posts
ALTER TABLE public.posts ADD COLUMN target_regions TEXT[] DEFAULT ARRAY['fr'];

-- Insert default regions
INSERT INTO public.regions (code, name, display_order) VALUES
  ('fr', 'France', 1),
  ('corse', 'Corse', 2),
  ('reunion', 'Réunion', 3),
  ('martinique', 'Martinique', 4),
  ('guadeloupe', 'Guadeloupe', 5),
  ('guyane', 'Guyane', 6);

-- Auto-update updated_at
CREATE TRIGGER update_regions_updated_at
  BEFORE UPDATE ON public.regions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
