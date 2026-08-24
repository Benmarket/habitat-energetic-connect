-- 1) L'email de contact des annonceurs n'est plus lisible publiquement (anti-scraping).
REVOKE SELECT (contact_email) ON public.advertisers FROM anon, authenticated;

-- 2) Les administrateurs conservent l'accès complet via une vue protégée.
CREATE OR REPLACE VIEW public.advertisers_admin
WITH (security_invoker = false)
AS
SELECT a.*
FROM public.advertisers a
WHERE public.has_role(auth.uid(), 'admin'::app_role)
   OR public.has_role(auth.uid(), 'super_admin'::app_role);

REVOKE ALL ON public.advertisers_admin FROM anon;
GRANT SELECT ON public.advertisers_admin TO authenticated;

-- 3) Les fonctions SECURITY DEFINER internes ne sont plus appelables depuis l'API publique.
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_already_used(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.phone_already_used(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_ai_call(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_ai_rate_limit(uuid, text, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_edge_call(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_edge_rate(text, text, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_form_submission_rate(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_lead_rate(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_newsletter_rate(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_ad_analytics_rate(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_password_reset_rate(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_page_view_rate(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_permission(text, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(app_role, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_visitor_id() FROM anon, authenticated;

-- Les fonctions utilisées dans les règles d'accès (RLS) doivent rester exécutables
-- par les rôles concernés, sinon toutes les lectures/écritures échouent.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(app_role, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_visitor_id() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_page_view_rate(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_ad_analytics_rate(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_form_submission_rate(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_lead_rate(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_newsletter_rate(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_password_reset_rate(text, text) TO anon, authenticated;
-- Vérifications d'unicité utilisées par le formulaire d'inscription
GRANT EXECUTE ON FUNCTION public.email_already_used(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.phone_already_used(text) TO anon, authenticated;