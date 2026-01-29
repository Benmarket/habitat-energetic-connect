-- 1. Enable RLS explicitly
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing UPDATE policies on site_settings
DROP POLICY IF EXISTS "Only admins can update site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Anyone can update site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Authenticated users can update site_settings" ON public.site_settings;

-- 3. Create the secure UPDATE policy
CREATE POLICY "Only admins can update site_settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- 4. Also secure INSERT and DELETE if not already protected
DROP POLICY IF EXISTS "Only admins can insert site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Only admins can delete site_settings" ON public.site_settings;

CREATE POLICY "Only admins can insert site_settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Only admins can delete site_settings"
ON public.site_settings
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'super_admin'::app_role)
);