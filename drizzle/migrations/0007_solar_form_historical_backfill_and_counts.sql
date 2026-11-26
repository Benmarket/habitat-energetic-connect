UPDATE public.solar_simulations s SET ip_address=s.ip_address WHERE NOT EXISTS (SELECT 1 FROM public.form_submissions f WHERE f.solar_simulation_id=s.id);
CREATE OR REPLACE FUNCTION public.get_admin_form_submission_stats() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result jsonb;
BEGIN
 IF NOT public.has_role(auth.uid(),'super_admin'::public.app_role) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_object_agg(form_id::text,stats),'{}'::jsonb) INTO result FROM (SELECT form_id,jsonb_build_object('total',count(*),'unread',count(*) FILTER (WHERE NOT is_read),'processed',count(*) FILTER (WHERE status IN ('processed','converted'))) AS stats FROM public.form_submissions GROUP BY form_id) grouped;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_admin_form_submission_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_form_submission_stats() TO authenticated, service_role;