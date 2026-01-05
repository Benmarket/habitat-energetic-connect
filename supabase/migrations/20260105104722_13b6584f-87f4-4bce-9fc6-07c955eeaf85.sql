-- Add download_count column to posts table
ALTER TABLE public.posts 
ADD COLUMN download_count integer NOT NULL DEFAULT 0;