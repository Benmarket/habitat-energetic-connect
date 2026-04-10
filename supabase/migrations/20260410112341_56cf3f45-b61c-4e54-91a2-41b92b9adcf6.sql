
-- Fix security definer views by recreating them with SECURITY INVOKER
CREATE OR REPLACE VIEW public.advertisers_public
WITH (security_invoker = true) AS
SELECT id, name, logo, description, city, department, region, 
       intervention_radius_km, intervention_departments, website,
       postal_code, is_active, created_at, updated_at
FROM public.advertisers
WHERE is_active = true;

CREATE OR REPLACE VIEW public.form_configurations_public
WITH (security_invoker = true) AS
SELECT id, name, description, form_identifier, fields_schema, created_at, updated_at
FROM public.form_configurations;
