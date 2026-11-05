CREATE TABLE public.article_newsletter_requests (
 post_id uuid PRIMARY KEY REFERENCES public.posts(id) ON DELETE CASCADE,
 requested_by uuid NOT NULL,
 requested_at timestamptz NOT NULL DEFAULT now(),
 status text NOT NULL DEFAULT 'blocked_provider'
);
GRANT ALL ON public.article_newsletter_requests TO service_role;
ALTER TABLE public.article_newsletter_requests ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.request_article_newsletter(p_post_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NOT public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id=p_post_id AND content_type='actualite' AND status='published') THEN RAISE EXCEPTION 'Article non publié'; END IF;
 INSERT INTO public.article_newsletter_requests(post_id,requested_by) VALUES(p_post_id,auth.uid()) ON CONFLICT(post_id) DO NOTHING;
 RETURN jsonb_build_object('status','blocked_provider');
END $$;
REVOKE ALL ON FUNCTION public.request_article_newsletter(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.request_article_newsletter(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.get_article_email_stats(p_post_id uuid, p_offset integer DEFAULT 0) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE result jsonb;
BEGIN
 IF NOT public.has_role(auth.uid(), 'super_admin'::public.app_role) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 WITH related AS (
 SELECT DISTINCT message_id FROM public.email_send_log
 WHERE message_id IS NOT NULL AND template_name='newsletter-new-article'
 AND (metadata->>'article_id'=p_post_id::text OR message_id LIKE 'newsletter-article-'||p_post_id::text||'-%')
 ), latest AS (
 SELECT DISTINCT ON(l.message_id) l.* FROM public.email_send_log l JOIN related r USING(message_id)
 ORDER BY l.message_id,l.created_at DESC,l.id DESC
 ), events AS (
 SELECT e.message_id,count(*) FILTER(WHERE event_type='open') AS opens,count(*) FILTER(WHERE event_type='click') AS clicks,
 min(created_at) FILTER(WHERE event_type='open') AS first_open
 FROM public.email_events e JOIN related r USING(message_id) GROUP BY e.message_id
 ), rows AS (
 SELECT l.message_id,l.recipient_email,l.status,l.created_at,l.error_message,coalesce(e.opens,0) AS opens,coalesce(e.clicks,0) AS clicks,e.first_open
 FROM latest l LEFT JOIN events e USING(message_id)
 )
 SELECT jsonb_build_object(
 'total',count(*),'sent',count(*) FILTER(WHERE status='sent'),
 'failed',count(*) FILTER(WHERE status IN('dlq','failed')),'pending',count(*) FILTER(WHERE status='pending'),
 'suppressed',count(*) FILTER(WHERE status='suppressed'),
 'opened',count(DISTINCT recipient_email) FILTER(WHERE opens>0),
 'clicked',count(DISTINCT recipient_email) FILTER(WHERE clicks>0),
 'request',(SELECT to_jsonb(q) - 'requested_by' FROM public.article_newsletter_requests q WHERE post_id=p_post_id),
 'recipients',coalesce((SELECT jsonb_agg(to_jsonb(page)) FROM (SELECT * FROM rows ORDER BY created_at DESC,message_id LIMIT 50 OFFSET greatest(p_offset,0)) page),'[]'::jsonb)
 ) INTO result FROM rows;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.get_article_email_stats(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_article_email_stats(uuid,integer) TO authenticated;