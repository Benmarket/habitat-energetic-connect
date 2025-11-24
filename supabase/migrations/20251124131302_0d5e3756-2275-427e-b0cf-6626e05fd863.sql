-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- Create table to store media metadata
CREATE TABLE public.media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  alt_text TEXT,
  storage_path TEXT NOT NULL UNIQUE,
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all media
CREATE POLICY "Authenticated users can view media"
ON public.media
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to upload media
CREATE POLICY "Authenticated users can upload media"
ON public.media
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own media metadata
CREATE POLICY "Users can update their own media"
ON public.media
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow admins to delete media
CREATE POLICY "Admins can delete media"
ON public.media
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Storage policies for media bucket
CREATE POLICY "Authenticated users can view media files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload media files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'media' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own media files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete media files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'media' 
  AND auth.uid() IS NOT NULL
);

-- Trigger to update updated_at
CREATE TRIGGER update_media_updated_at
BEFORE UPDATE ON public.media
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();