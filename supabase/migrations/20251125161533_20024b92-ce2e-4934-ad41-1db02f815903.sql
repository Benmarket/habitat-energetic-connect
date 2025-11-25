-- Fix RLS policies for site_settings to ensure public read access works
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Only admins can update site settings" ON public.site_settings;

-- Create separate policies for different operations
CREATE POLICY "Public read access to site_settings"
ON public.site_settings
FOR SELECT
USING (true);

CREATE POLICY "Only admins can insert site_settings"
ON public.site_settings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Only admins can update site_settings"
ON public.site_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);

CREATE POLICY "Only admins can delete site_settings"
ON public.site_settings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'admin')
  )
);