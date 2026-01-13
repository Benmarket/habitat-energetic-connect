-- Add target_regions field to advertisements table for audience targeting
ALTER TABLE public.advertisements 
ADD COLUMN IF NOT EXISTS target_regions text[] DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.advertisements.target_regions IS 'Target regions for this advertisement. NULL means all regions. Values: fr, corse, guadeloupe, martinique, guyane, reunion';
