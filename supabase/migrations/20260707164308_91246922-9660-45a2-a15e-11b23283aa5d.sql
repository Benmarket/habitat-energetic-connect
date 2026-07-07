ALTER TABLE public.page_views
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS device_type text;

CREATE INDEX IF NOT EXISTS idx_page_views_utm_source ON public.page_views(utm_source);
CREATE INDEX IF NOT EXISTS idx_page_views_device_type ON public.page_views(device_type);