-- Add tldr and faq columns to posts table
ALTER TABLE public.posts
ADD COLUMN tldr text,
ADD COLUMN faq jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.posts.tldr IS 'Résumé TL;DR (Too Long; Didnt Read) de l''article - bloc synthétique affiché en début d''article';
COMMENT ON COLUMN public.posts.faq IS 'Questions FAQ sous format JSON array: [{"question": "...", "answer": "..."}]';