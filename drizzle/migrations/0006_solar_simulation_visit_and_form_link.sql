ALTER TABLE public.solar_simulations ADD COLUMN ip_address text, ADD COLUMN user_agent text, ADD COLUMN device_type text, ADD COLUMN browser text;
ALTER TABLE public.form_submissions ADD COLUMN solar_simulation_id uuid REFERENCES public.solar_simulations(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX form_submissions_solar_simulation_unique ON public.form_submissions(solar_simulation_id) WHERE solar_simulation_id IS NOT NULL;
COMMENT ON COLUMN public.solar_simulations.ip_address IS 'Request IP captured server-side at creation; historical records remain NULL.';

CREATE OR REPLACE FUNCTION public.sync_solar_form_submission() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE fid uuid; contact public.leads; scenario jsonb; payload jsonb;
BEGIN
 SELECT id INTO fid FROM public.form_configurations WHERE form_identifier='simulation-solaire';
 IF fid IS NULL THEN RAISE EXCEPTION 'Solar form configuration missing'; END IF;
 IF NEW.lead_id IS NOT NULL THEN SELECT * INTO contact FROM public.leads WHERE id=NEW.lead_id; END IF;
 scenario := CASE WHEN NEW.snapshot#>>'{engine,configRecommandee,batterie}'='true' THEN NEW.snapshot#>'{engine,avec}' ELSE NEW.snapshot#>'{engine,sans}' END;
 payload := jsonb_strip_nulls(jsonb_build_object('simulationCode',NEW.reference,'firstName',contact.first_name,'lastName',contact.last_name,'email',contact.email,'phone',contact.phone,'postalCode',NEW.snapshot#>>'{inputs,postalCode}','city',NEW.snapshot#>>'{inputs,city}','factureMensuelle',NEW.snapshot#>'{inputs,monthlyBill}','puissanceChoisie',scenario->'puissanceKwc','gainsAnnuels',scenario->'economiesAn','contactStatus',CASE WHEN NEW.lead_id IS NULL THEN 'Sans coordonnées' ELSE 'Coordonnées reçues' END,'deviceType',NEW.device_type,'browser',NEW.browser,'_attribution',contact.attribution));
 INSERT INTO public.form_submissions(form_id,solar_simulation_id,data,submitted_at,ip_address,user_agent,attribution,consent)
 VALUES(fid,NEW.id,payload,NEW.created_at,NEW.ip_address,NEW.user_agent,contact.attribution,contact.consent)
 ON CONFLICT (solar_simulation_id) WHERE solar_simulation_id IS NOT NULL DO UPDATE SET data=EXCLUDED.data,ip_address=EXCLUDED.ip_address,user_agent=EXCLUDED.user_agent,attribution=EXCLUDED.attribution,consent=EXCLUDED.consent;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sync_solar_form_submission() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_solar_form_submission() TO service_role;
CREATE TRIGGER solar_form_submission_sync AFTER INSERT OR UPDATE OF lead_id,ip_address,user_agent,device_type,browser ON public.solar_simulations FOR EACH ROW EXECUTE FUNCTION public.sync_solar_form_submission();

CREATE OR REPLACE FUNCTION public.sync_solar_form_contact() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 UPDATE public.form_submissions SET data=data || jsonb_build_object('firstName',NEW.first_name,'lastName',NEW.last_name,'email',NEW.email,'phone',NEW.phone),attribution=NEW.attribution,consent=NEW.consent
 WHERE solar_simulation_id IN (SELECT id FROM public.solar_simulations WHERE lead_id=NEW.id);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sync_solar_form_contact() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_solar_form_contact() TO service_role;
CREATE TRIGGER solar_form_contact_sync AFTER UPDATE OF first_name,last_name,email,phone,attribution,consent ON public.leads FOR EACH ROW EXECUTE FUNCTION public.sync_solar_form_contact();

ALTER POLICY "Admins can view all form submissions" ON public.form_submissions USING (public.has_role(auth.uid(),'super_admin'::public.app_role) OR (solar_simulation_id IS NULL AND (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'moderator'::public.app_role))));
ALTER POLICY "Admins can update form submissions" ON public.form_submissions USING (public.has_role(auth.uid(),'super_admin'::public.app_role) OR (solar_simulation_id IS NULL AND (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'moderator'::public.app_role)))) WITH CHECK (public.has_role(auth.uid(),'super_admin'::public.app_role) OR (solar_simulation_id IS NULL AND (public.has_role(auth.uid(),'admin'::public.app_role) OR public.has_role(auth.uid(),'moderator'::public.app_role))));
ALTER POLICY "Admins can delete form submissions" ON public.form_submissions USING (public.has_role(auth.uid(),'super_admin'::public.app_role) OR (solar_simulation_id IS NULL AND public.has_role(auth.uid(),'admin'::public.app_role)));
ALTER POLICY "Rate limited form submissions" ON public.form_submissions WITH CHECK (solar_simulation_id IS NULL AND public.check_form_submission_rate(ip_address));

CREATE OR REPLACE FUNCTION public.get_admin_form_submissions(p_form_id uuid DEFAULT NULL) RETURNS SETOF public.form_submissions LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT public.has_role(auth.uid(),'super_admin'::public.app_role) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT * FROM public.form_submissions WHERE p_form_id IS NULL OR form_id=p_form_id ORDER BY submitted_at DESC;
END $$;
REVOKE ALL ON FUNCTION public.get_admin_form_submissions(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_form_submissions(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_solar_simulations(p_search text DEFAULT '',p_offset integer DEFAULT 0,p_reference text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result jsonb;
BEGIN
 IF NOT public.has_role(auth.uid(),'super_admin'::public.app_role) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 WITH matched AS (
 SELECT s.reference,s.created_at,s.lead_id,l.first_name,l.last_name,l.email,l.phone,s.snapshot,s.ip_address,s.user_agent,s.device_type,s.browser
 FROM public.solar_simulations s LEFT JOIN public.leads l ON l.id=s.lead_id
 WHERE (p_reference IS NULL OR s.reference=p_reference) AND (coalesce(p_search,'')='' OR s.reference ILIKE '%'||left(p_search,100)||'%' OR concat_ws(' ',l.first_name,l.last_name,l.email) ILIKE '%'||left(p_search,100)||'%')
 ) SELECT jsonb_build_object('total',count(*),'items',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (SELECT reference,created_at,lead_id,first_name,last_name,email,phone,ip_address,user_agent,device_type,browser,CASE WHEN p_reference IS NOT NULL THEN snapshot ELSE jsonb_build_object('inputs',snapshot->'inputs','engine',jsonb_build_object('territoire',snapshot#>'{engine,territoire}','territoireId',snapshot#>'{engine,territoireId}','configRecommandee',snapshot#>'{engine,configRecommandee}','sans',snapshot#>'{engine,sans}','avec',snapshot#>'{engine,avec}')) END AS snapshot FROM matched ORDER BY created_at DESC,reference LIMIT 25 OFFSET greatest(p_offset,0)) t),'[]'::jsonb)) INTO result FROM matched;
 RETURN result;
END $$;