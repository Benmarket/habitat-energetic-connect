-- Add postal_codes field to solar_simulator_regions for auto-detection
ALTER TABLE public.solar_simulator_regions 
ADD COLUMN postal_prefixes text[] DEFAULT '{}';

-- Update France Métropolitaine (default) - empty means it's the fallback
UPDATE public.solar_simulator_regions 
SET postal_prefixes = '{}' 
WHERE name = 'France Métropolitaine';

-- Insert Corse region
INSERT INTO public.solar_simulator_regions (name, postal_prefixes, display_order)
VALUES ('Corse', ARRAY['20'], 2);

-- Insert Guadeloupe region
INSERT INTO public.solar_simulator_regions (name, postal_prefixes, display_order)
VALUES ('Guadeloupe', ARRAY['971'], 3);