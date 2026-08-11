-- 1) Advertisers: hide contact_email from anonymous visitors
REVOKE SELECT ON public.advertisers FROM anon;
GRANT SELECT (id, name, logo, description, website, is_active, created_at, updated_at, postal_code, city, department, region, intervention_radius_km, intervention_departments) ON public.advertisers TO anon;

-- 2) chat_agent_requests: only on conversations owned by the caller
DROP POLICY IF EXISTS "Users can create agent requests" ON public.chat_agent_requests;
CREATE POLICY "Users can create agent requests on own conversation"
ON public.chat_agent_requests
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_agent_requests.conversation_id
      AND (
        (c.user_id IS NOT NULL AND c.user_id = auth.uid())
        OR (c.visitor_id IS NOT NULL AND c.visitor_id = public.current_visitor_id())
      )
  )
);

-- 3) simulator_tracking_sessions: no direct anon writes (edge function uses service_role)
DROP POLICY IF EXISTS "Anon can update own anonymous recent session" ON public.simulator_tracking_sessions;
DROP POLICY IF EXISTS "Anyone can create tracking session" ON public.simulator_tracking_sessions;
REVOKE INSERT, UPDATE ON public.simulator_tracking_sessions FROM anon, authenticated;
GRANT ALL ON public.simulator_tracking_sessions TO service_role;

-- 4) SECURITY DEFINER functions: revoke execute from anon/authenticated where not needed
DO $$
DECLARE
  f record;
  keep_anon text[] := ARRAY[
    'has_role','has_permission','current_visitor_id','issue_visitor_session',
    'check_form_submission_rate','check_lead_rate','check_newsletter_rate',
    'check_page_view_rate','check_ad_analytics_rate'
  ];
  keep_auth text[] := ARRAY[
    'has_role','has_permission','current_visitor_id','issue_visitor_session',
    'check_form_submission_rate','check_lead_rate','check_newsletter_rate',
    'check_page_view_rate','check_ad_analytics_rate',
    'get_simulator_tracking_stats','expire_stale_agent_requests','mark_abandoned_conversations'
  ];
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef AND p.prorettype <> 'trigger'::regtype
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
    IF f.proname = ANY(keep_anon) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon', f.sig);
    END IF;
    IF f.proname = ANY(keep_auth) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f.sig);
    END IF;
  END LOOP;
END $$;

-- 4b) Add role guards to admin-only maintenance functions still callable by signed-in users
CREATE OR REPLACE FUNCTION public.expire_stale_agent_requests()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE chat_agent_requests
  SET status = 'expired', expired_at = NOW()
  WHERE status = 'pending'
    AND created_at < NOW() - (COALESCE(timeout_minutes, 10) * INTERVAL '1 minute');

  UPDATE chat_conversations c
  SET status = 'expired', closed_at = NOW(), closed_reason = 'timeout'
  FROM chat_agent_requests r
  WHERE c.id = r.conversation_id
    AND r.status = 'expired'
    AND c.status = 'awaiting_agent';
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_abandoned_conversations()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'super_admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE chat_conversations
  SET status = 'abandoned', closed_at = NOW(), closed_reason = 'no_heartbeat'
  WHERE status IN ('awaiting_agent', 'active')
    AND last_seen_at IS NOT NULL
    AND last_seen_at < NOW() - INTERVAL '2 minutes';

  UPDATE chat_agent_requests r
  SET status = 'abandoned'
  FROM chat_conversations c
  WHERE r.conversation_id = c.id
    AND r.status = 'pending'
    AND c.status = 'abandoned';
END;
$function$;
