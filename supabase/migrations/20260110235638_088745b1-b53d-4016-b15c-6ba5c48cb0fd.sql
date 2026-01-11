-- Add topline color customization fields to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS topline_bg_color TEXT DEFAULT '#22c55e';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS topline_text_color TEXT DEFAULT '#ffffff';