-- 1. Re-grant EXECUTE sur les fonctions essentielles (révoquées par erreur)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(app_role, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_visitor_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_visitor_session(integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_form_submission_rate(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_lead_rate(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_newsletter_rate(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_ad_analytics_rate(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_page_view_rate(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_has_account(text) TO anon, authenticated;

-- 2. Réparer issue_visitor_session : son search_path 'public' empêche l'accès à pgcrypto
CREATE OR REPLACE FUNCTION public.issue_visitor_session(p_expires_in_seconds integer DEFAULT 86400)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_visitor_id text;
  v_token text;
  v_token_hash text;
  v_expires_at timestamptz;
BEGIN
  v_visitor_id := 'visitor_' || replace(gen_random_uuid()::text, '-', '');
  v_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(digest(v_token, 'sha256'), 'hex');
  v_expires_at := now() + (p_expires_in_seconds || ' seconds')::interval;
  
  INSERT INTO public.visitor_sessions (visitor_id, token_hash, expires_at)
  VALUES (v_visitor_id, v_token_hash, v_expires_at);
  
  RETURN jsonb_build_object(
    'visitor_id', v_visitor_id,
    'token', v_token,
    'expires_at', v_expires_at
  );
END;
$function$;

-- 3. Idem pour current_visitor_id (utilise digest de pgcrypto)
CREATE OR REPLACE FUNCTION public.current_visitor_id()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_token text;
  v_token_hash text;
  v_visitor_id text;
BEGIN
  v_token := current_setting('request.headers', true)::json->>'x-visitor-token';
  IF v_token IS NULL OR v_token = '' THEN
    RETURN NULL;
  END IF;
  v_token_hash := encode(digest(v_token, 'sha256'), 'hex');
  SELECT visitor_id INTO v_visitor_id
  FROM public.visitor_sessions
  WHERE token_hash = v_token_hash AND expires_at > now();
  RETURN v_visitor_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.current_visitor_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.issue_visitor_session(integer) TO anon, authenticated;
