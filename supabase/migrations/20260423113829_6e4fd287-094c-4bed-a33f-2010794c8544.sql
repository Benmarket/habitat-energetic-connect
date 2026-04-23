-- 1. Add email toggle columns to form_configurations
ALTER TABLE public.form_configurations
  ADD COLUMN IF NOT EXISTS send_confirmation_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS include_signup_link boolean NOT NULL DEFAULT true;

-- 2. Recreate the public view to expose the new email flags (needed for anonymous form submissions)
DROP VIEW IF EXISTS public.form_configurations_public;
CREATE VIEW public.form_configurations_public AS
SELECT
  id,
  name,
  form_identifier,
  description,
  fields_schema,
  send_confirmation_email,
  include_signup_link,
  created_at,
  updated_at
FROM public.form_configurations;

GRANT SELECT ON public.form_configurations_public TO anon, authenticated;

-- 3. Create activation tokens table for magic-link signup
CREATE TABLE IF NOT EXISTS public.signup_activation_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  email text NOT NULL,
  first_name text,
  last_name text,
  phone text,
  source_form_identifier text,
  source_submission_id uuid,
  used_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signup_activation_tokens_email ON public.signup_activation_tokens (email);
CREATE INDEX IF NOT EXISTS idx_signup_activation_tokens_expires ON public.signup_activation_tokens (expires_at);

ALTER TABLE public.signup_activation_tokens ENABLE ROW LEVEL SECURITY;

-- Only admins can view (for support/debug); service role bypasses RLS for the activation flow
CREATE POLICY "Admins can view activation tokens"
  ON public.signup_activation_tokens
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- No INSERT/UPDATE/DELETE policies → only service role can write