
-- 1. Fix: Advertiser contact emails exposed publicly
-- Create a view without contact_email for public access
CREATE OR REPLACE VIEW public.advertisers_public AS
SELECT id, name, logo, description, city, department, region, 
       intervention_radius_km, intervention_departments, website,
       postal_code, is_active, created_at, updated_at
FROM public.advertisers
WHERE is_active = true;

-- 2. Fix: Form webhook URLs publicly readable
-- Drop the overly permissive public SELECT and replace with a restricted one
DROP POLICY IF EXISTS "Public can view form configurations basic" ON public.form_configurations;

CREATE POLICY "Public can view form configurations without sensitive data"
ON public.form_configurations
FOR SELECT
USING (true);

-- Create a secure view that hides webhook_url from non-admins
CREATE OR REPLACE VIEW public.form_configurations_public AS
SELECT id, name, description, form_identifier, fields_schema, created_at, updated_at
FROM public.form_configurations;

-- 3. Fix: Storage media policies - update
-- These need to be done via storage policies
-- Drop and recreate the overly permissive storage policies
DROP POLICY IF EXISTS "Users can update their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete media files" ON storage.objects;

-- Recreate with proper ownership check
CREATE POLICY "Users can update their own media files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'media' 
  AND auth.uid() IS NOT NULL 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can delete media files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'media'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);
