
-- 1) Revoke EXECUTE on SECURITY DEFINER functions that are only used by
--    edge functions (service_role) or internal triggers/cron — not by clients.
REVOKE EXECUTE ON FUNCTION public.email_already_used(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.phone_already_used(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_has_account(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_password_reset_rate(text, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM anon, authenticated, PUBLIC;

-- Keep service_role able to call these (edge functions / cron)
GRANT EXECUTE ON FUNCTION public.email_already_used(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.phone_already_used(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.email_has_account(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_password_reset_rate(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_wake() TO service_role;

-- 2) Restrict LIST access on public buckets — public downloads via the CDN
--    (getPublicUrl) still work because they bypass RLS on storage.objects.
DROP POLICY IF EXISTS "Public read media" ON storage.objects;
DROP POLICY IF EXISTS "Public read forum images" ON storage.objects;
DROP POLICY IF EXISTS "Public read email assets" ON storage.objects;
DROP POLICY IF EXISTS "Public download access for email-assets" ON storage.objects;

CREATE POLICY "Authenticated can list media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'media');

CREATE POLICY "Authenticated can list forum images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'forum-images');

CREATE POLICY "Authenticated can list email assets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'email-assets');
