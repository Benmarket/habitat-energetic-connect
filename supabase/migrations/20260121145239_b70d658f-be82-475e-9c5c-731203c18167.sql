-- Create a table for landing pages configuration
CREATE TABLE public.landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  path TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Sun',
  color TEXT NOT NULL DEFAULT 'text-orange-600',
  bg_color TEXT NOT NULL DEFAULT 'bg-orange-100',
  seo_status TEXT NOT NULL DEFAULT 'seo' CHECK (seo_status IN ('seo', 'hidden', 'disabled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Landing pages are viewable by everyone"
ON public.landing_pages
FOR SELECT
USING (true);

-- Create policy for admin updates
CREATE POLICY "Authenticated users can update landing pages"
ON public.landing_pages
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Create policy for admin inserts
CREATE POLICY "Authenticated users can insert landing pages"
ON public.landing_pages
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_landing_pages_updated_at
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default landing pages
INSERT INTO public.landing_pages (slug, title, description, path, icon, color, bg_color, seo_status)
VALUES 
  ('solaire', 'Solaire Photovoltaïque', 'Installation de panneaux solaires pour production d''électricité', '/landing/solaire', 'Sun', 'text-orange-600', 'bg-orange-100', 'seo'),
  ('isolation', 'Isolation Thermique', 'Isolation des combles, murs et planchers', '/landing/isolation', 'Home', 'text-blue-600', 'bg-blue-100', 'seo'),
  ('pompe-a-chaleur', 'Pompe à Chaleur', 'Installation de pompe à chaleur air/eau ou air/air', '/landing/pompe-a-chaleur', 'Thermometer', 'text-green-600', 'bg-green-100', 'seo'),
  ('renovation-globale', 'Rénovation Globale', 'Projet de rénovation énergétique d''ampleur', '/landing/renovation-globale', 'Building2', 'text-purple-600', 'bg-purple-100', 'seo');