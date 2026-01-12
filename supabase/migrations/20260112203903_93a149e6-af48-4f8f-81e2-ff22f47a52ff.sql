-- Add target audience column to posts table for aides classification
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS target_audience text[] DEFAULT ARRAY['particulier']::text[];

-- Add comment to explain the column
COMMENT ON COLUMN public.posts.target_audience IS 'Target audience for aides: particulier, professionnel, or both';

-- Update existing aides with default classification (we'll update specific ones later)
UPDATE public.posts 
SET target_audience = ARRAY['particulier', 'professionnel']::text[]
WHERE content_type = 'aide';