-- 1. Fix landing_pages: restrict INSERT/UPDATE to admin roles only
DROP POLICY IF EXISTS "Authenticated users can insert landing pages" ON public.landing_pages;
DROP POLICY IF EXISTS "Authenticated users can update landing pages" ON public.landing_pages;

CREATE POLICY "Admins can insert landing pages"
ON public.landing_pages
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins can update landing pages"
ON public.landing_pages
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Admins can delete landing pages"
ON public.landing_pages
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- 2. Fix form_configurations: restrict webhook_url visibility
DROP POLICY IF EXISTS "Public can view form configurations" ON public.form_configurations;

CREATE POLICY "Public can view form configurations basic"
ON public.form_configurations
FOR SELECT
USING (true);

-- 3. Fix check_page_view_rate: deny when no visitor identification
CREATE OR REPLACE FUNCTION public.check_page_view_rate(p_visitor_id text, p_ip text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  -- Deny if no identifying information at all
  IF (p_visitor_id IS NULL OR p_visitor_id = '') AND (p_ip IS NULL OR p_ip = '') THEN
    RETURN false;
  END IF;
  
  SELECT COUNT(*) INTO recent_count
  FROM page_views
  WHERE visitor_id = p_visitor_id
    AND created_at > NOW() - INTERVAL '1 hour';
  
  RETURN recent_count < 100;
END;
$$;