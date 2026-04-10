
-- Remove analytics tables from realtime (they don't need realtime and expose data)
ALTER PUBLICATION supabase_realtime DROP TABLE public.ad_analytics;
ALTER PUBLICATION supabase_realtime DROP TABLE public.page_views;
