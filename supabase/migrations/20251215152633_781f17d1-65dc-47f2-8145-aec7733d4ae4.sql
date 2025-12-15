-- Create authors table for reusable author profiles
CREATE TABLE public.authors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;

-- Public can view authors (for article display)
CREATE POLICY "Anyone can view authors"
ON public.authors
FOR SELECT
USING (true);

-- Admins can manage authors
CREATE POLICY "Admins can manage authors"
ON public.authors
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Add author columns to posts table
ALTER TABLE public.posts 
ADD COLUMN hide_author BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN author_display_type TEXT DEFAULT 'none',
ADD COLUMN display_author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
ADD COLUMN custom_author_name TEXT;

-- Create trigger for updated_at on authors
CREATE TRIGGER update_authors_updated_at
BEFORE UPDATE ON public.authors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();