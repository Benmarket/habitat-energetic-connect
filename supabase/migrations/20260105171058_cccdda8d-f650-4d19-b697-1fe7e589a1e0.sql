-- Add location fields to advertisers table
ALTER TABLE public.advertisers
ADD COLUMN postal_code text,
ADD COLUMN city text,
ADD COLUMN department text,
ADD COLUMN region text,
ADD COLUMN intervention_radius_km integer,
ADD COLUMN intervention_departments text[] DEFAULT ARRAY[]::text[];

-- Create index for faster searches
CREATE INDEX idx_advertisers_postal_code ON public.advertisers(postal_code);
CREATE INDEX idx_advertisers_department ON public.advertisers(department);
CREATE INDEX idx_advertisers_city ON public.advertisers(city);
CREATE INDEX idx_advertisers_intervention_departments ON public.advertisers USING GIN(intervention_departments);