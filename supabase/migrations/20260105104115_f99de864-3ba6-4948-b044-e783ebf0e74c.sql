-- Add guide-specific columns to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_members_only boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS guide_template text DEFAULT 'classique',
ADD COLUMN IF NOT EXISTS is_downloadable boolean NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.posts.is_members_only IS 'If true, full content is only visible to logged-in users';
COMMENT ON COLUMN public.posts.guide_template IS 'Template style for guides: classique, premium, expert';
COMMENT ON COLUMN public.posts.is_downloadable IS 'If true, shows download button for guides';