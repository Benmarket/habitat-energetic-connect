
-- 1) Fix search_path on email queue functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

-- 2) Revoke EXECUTE from anon + authenticated on functions that should NOT be callable from clients.
-- These are either:
--   - trigger functions (only fired internally)
--   - admin/server-only helpers
--   - email queue plumbing (called by edge functions w/ service_role)
--   - AI rate-limit recording (server-only)

-- Trigger functions
REVOKE EXECUTE ON FUNCTION public.update_chat_conversation_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_seo_status_changed_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_site_settings_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_single_main_flow() FROM anon, authenticated;

-- Maintenance / cron-style server functions
REVOKE EXECUTE ON FUNCTION public.expire_stale_agent_requests() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_abandoned_conversations() FROM anon, authenticated;

-- AI rate limit recording (server only)
REVOKE EXECUTE ON FUNCTION public.check_ai_rate_limit(uuid, text, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_ai_call(uuid, text) FROM anon, authenticated;

-- Email queue plumbing (called by edge functions with service_role)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;

-- Role / permission helpers : only used inside RLS policies (SECURITY DEFINER triggers them in policy context).
-- Revoking EXECUTE from clients doesn't break RLS evaluation.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(app_role, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(_user_id uuid, _role app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_permission(text, uuid) FROM anon, authenticated;

-- 3) Functions that MUST remain callable by anon (do NOT revoke):
--   - issue_visitor_session, current_visitor_id  : visitor session bootstrap
--   - check_form_submission_rate, check_lead_rate, check_newsletter_rate,
--     check_page_view_rate, check_ad_analytics_rate : called from RLS policies on public inserts
--   - email_has_account : used by signup flow for "already-registered" UX
-- These intentionally stay accessible.
