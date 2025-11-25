-- Create advertisers table
CREATE TABLE IF NOT EXISTS public.advertisers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  description TEXT,
  website TEXT,
  contact_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create advertisements table
CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT,
  price NUMERIC(10,2),
  original_price NUMERIC(10,2),
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  cta_text TEXT NOT NULL DEFAULT 'Voir l''offre',
  cta_url TEXT NOT NULL,
  badge_text TEXT,
  badge_type TEXT DEFAULT 'sponsored' CHECK (badge_type IN ('sponsored', 'new', 'featured')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for advertisers
CREATE POLICY "Public can view active advertisers"
  ON public.advertisers
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage advertisers"
  ON public.advertisers
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
  );

-- RLS Policies for advertisements
CREATE POLICY "Public can view active advertisements"
  ON public.advertisements
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage advertisements"
  ON public.advertisements
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Add updated_at trigger for advertisers
CREATE TRIGGER update_advertisers_updated_at
  BEFORE UPDATE ON public.advertisers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for advertisements
CREATE TRIGGER update_advertisements_updated_at
  BEFORE UPDATE ON public.advertisements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();