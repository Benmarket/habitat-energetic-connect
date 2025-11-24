-- Add focus_keywords column to posts table for SEO targeting
ALTER TABLE public.posts
ADD COLUMN focus_keywords text[] DEFAULT ARRAY[]::text[];

COMMENT ON COLUMN public.posts.focus_keywords IS 'Target keywords for SEO and AI ranking (ChatGPT, Google, etc.)';