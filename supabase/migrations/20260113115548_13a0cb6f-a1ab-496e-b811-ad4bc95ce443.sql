-- Create table to track page views with region context
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url TEXT NOT NULL,
  region_code TEXT NOT NULL DEFAULT 'fr',
  user_id UUID,
  visitor_id TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for tracking (visitors don't need to be authenticated)
CREATE POLICY "Anyone can insert page views" 
ON public.page_views 
FOR INSERT 
WITH CHECK (true);

-- Only admins can read page views
CREATE POLICY "Admins can read page views" 
ON public.page_views 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Create index for faster queries
CREATE INDEX idx_page_views_region ON public.page_views(region_code);
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX idx_page_views_page_url ON public.page_views(page_url);

-- Enable realtime for page_views table
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_views;