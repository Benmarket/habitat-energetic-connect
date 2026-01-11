-- Add badge_image column to posts table for guide badges
ALTER TABLE public.posts 
ADD COLUMN badge_image TEXT DEFAULT NULL;