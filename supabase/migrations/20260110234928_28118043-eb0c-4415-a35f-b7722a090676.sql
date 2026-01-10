-- Add topline field to posts table for guide banners
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS topline TEXT;