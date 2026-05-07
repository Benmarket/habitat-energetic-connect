
-- Revoke EXECUTE from PUBLIC (which is what's still granting access)
REVOKE EXECUTE ON FUNCTION public.update_chat_conversation_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_seo_status_changed_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_site_settings_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_single_main_flow() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.expire_stale_agent_requests() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_abandoned_conversations() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_ai_rate_limit(uuid, text, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_ai_call(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(app_role, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_permission(text, uuid) FROM PUBLIC;

-- check_ad_analytics_rate is used by RLS on public ad_analytics inserts -> keep accessible
-- check_form_submission_rate / check_lead_rate / check_newsletter_rate / check_page_view_rate -> keep accessible
-- current_visitor_id / issue_visitor_session -> keep accessible
-- email_has_account -> keep accessible (signup UX)
