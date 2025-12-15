-- Create dedicated storage bucket for forum images
INSERT INTO storage.buckets (id, name, public)
VALUES ('forum-images', 'forum-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create table to track forum image metadata
CREATE TABLE public.forum_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES forum_topics(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT,
  file_size INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view forum images
CREATE POLICY "Anyone can view forum images"
ON public.forum_images
FOR SELECT
USING (true);

-- Authenticated users can upload forum images
CREATE POLICY "Authenticated users can upload forum images"
ON public.forum_images
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own images, admins can delete any
CREATE POLICY "Users and admins can delete forum images"
ON public.forum_images
FOR DELETE
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Storage policies for forum-images bucket
CREATE POLICY "Anyone can view forum images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'forum-images');

CREATE POLICY "Authenticated users can upload forum images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'forum-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users and admins can delete forum images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'forum-images' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  )
);