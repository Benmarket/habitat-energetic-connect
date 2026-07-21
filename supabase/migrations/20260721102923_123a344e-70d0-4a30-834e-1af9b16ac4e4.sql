ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS attribution jsonb;
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS attribution jsonb;
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS attribution jsonb;
CREATE INDEX IF NOT EXISTS idx_leads_attribution_source ON public.leads ((attribution->>'referrer_source'));
CREATE INDEX IF NOT EXISTS idx_form_submissions_attribution_source ON public.form_submissions ((attribution->>'referrer_source'));