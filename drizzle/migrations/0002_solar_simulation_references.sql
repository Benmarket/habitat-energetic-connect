CREATE TABLE public.solar_simulations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 reference text NOT NULL UNIQUE DEFAULT ('SIM-' || upper(replace(gen_random_uuid()::text,'-',''))),
 access_hash text NOT NULL,
 snapshot jsonb NOT NULL,
 lead_id uuid REFERENCES public.leads(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.solar_simulations TO service_role;
ALTER TABLE public.solar_simulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_solar_simulations ON public.solar_simulations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX solar_simulations_created_idx ON public.solar_simulations(created_at DESC);
CREATE OR REPLACE FUNCTION public.attach_solar_simulation(p_reference text,p_access_hash text,p_contact jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.solar_simulations; new_id uuid;
BEGIN
 SELECT * INTO s FROM public.solar_simulations WHERE reference=p_reference AND access_hash=p_access_hash FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid simulation' USING ERRCODE='42501'; END IF;
 IF s.lead_id IS NOT NULL THEN RETURN jsonb_build_object('leadId',s.lead_id,'reference',s.reference); END IF;
 IF NOT public.check_lead_rate(p_contact->>'email') THEN RAISE EXCEPTION 'Too many requests'; END IF;
 INSERT INTO public.leads(first_name,last_name,email,phone,address,postal_code,city,property_type,is_owner,needs,notes,attribution,consent)
 VALUES('Prospect','Solaire',p_contact->>'email',p_contact->>'phone',coalesce(nullif(s.snapshot#>>'{inputs,city}',''),'Non renseignée'),s.snapshot#>>'{inputs,postalCode}',coalesce(nullif(s.snapshot#>>'{inputs,city}',''),'Non renseignée'),s.snapshot#>>'{inputs,housing}',s.snapshot#>>'{inputs,ownership}'='oui',ARRAY['solaire'],jsonb_build_object('source','simulateur-solaire','simulationCode',s.reference,'simulation',s.snapshot)::text,p_contact->'attribution',p_contact->'consent') RETURNING id INTO new_id;
 UPDATE public.solar_simulations SET lead_id=new_id WHERE id=s.id;
 RETURN jsonb_build_object('leadId',new_id,'reference',s.reference);
END $$;
REVOKE ALL ON FUNCTION public.attach_solar_simulation(text,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.attach_solar_simulation(text,text,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.get_solar_simulations(p_search text DEFAULT '',p_offset integer DEFAULT 0,p_reference text DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result jsonb;
BEGIN
 IF NOT public.has_role(auth.uid(),'super_admin'::public.app_role) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 WITH matched AS (
 SELECT s.reference,s.created_at,s.lead_id,l.first_name,l.last_name,l.email,l.phone,s.snapshot
 FROM public.solar_simulations s LEFT JOIN public.leads l ON l.id=s.lead_id
 WHERE (p_reference IS NULL OR s.reference=p_reference) AND (coalesce(p_search,'')='' OR s.reference ILIKE '%'||left(p_search,100)||'%' OR concat_ws(' ',l.first_name,l.last_name,l.email) ILIKE '%'||left(p_search,100)||'%')
 ) SELECT jsonb_build_object('total',count(*),'items',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (SELECT reference,created_at,lead_id,first_name,last_name,email,phone,CASE WHEN p_reference IS NOT NULL THEN snapshot ELSE jsonb_build_object('inputs',snapshot->'inputs','recommended',snapshot#>'{engine,configRecommandee}') END AS snapshot FROM matched ORDER BY created_at DESC,reference LIMIT 25 OFFSET greatest(p_offset,0)) t),'[]'::jsonb)) INTO result FROM matched;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_solar_simulations(text,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_solar_simulations(text,integer,text) TO authenticated;
COMMENT ON TABLE public.solar_simulations IS 'Immutable rendered-engine snapshots; private reference is an identifier, never an authorization credential.';