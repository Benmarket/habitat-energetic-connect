ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS consent JSONB;
ALTER TABLE public.form_submissions ADD COLUMN IF NOT EXISTS consent JSONB;
ALTER TABLE public.newsletter_subscribers ADD COLUMN IF NOT EXISTS consent JSONB;