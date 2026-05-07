-- Table pour les tokens de réinitialisation de mot de passe
CREATE TABLE public.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  email text NOT NULL,
  used_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  created_at timestamptz NOT NULL DEFAULT now(),
  ip_address text
);

CREATE INDEX idx_password_reset_tokens_email ON public.password_reset_tokens(email);
CREATE INDEX idx_password_reset_tokens_expires ON public.password_reset_tokens(expires_at);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Aucune lecture/écriture publique : tout passe par les edge functions (service role)
CREATE POLICY "Admins can view password reset tokens"
ON public.password_reset_tokens
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Helper RPC : trouve le user_id par email (SECURITY DEFINER, lit auth.users)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1;
$$;

-- Rate limit pour les demandes de reset (anti-spam)
CREATE OR REPLACE FUNCTION public.check_password_reset_rate(p_email text, p_ip text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM password_reset_tokens
  WHERE (lower(email) = lower(p_email) OR (p_ip IS NOT NULL AND ip_address = p_ip))
    AND created_at > now() - interval '1 hour';
  RETURN recent_count < 5;
END;
$$;