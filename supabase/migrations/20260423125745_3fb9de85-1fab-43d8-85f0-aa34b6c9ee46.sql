-- RPC sécurisée pour détecter si un email existe déjà dans auth.users
-- Utilisée par l'orchestrateur send-form-confirmation pour choisir entre
-- le template "nouveau lead avec lien d'inscription" et le template
-- "lead existant - reconnexion encouragée".

CREATE OR REPLACE FUNCTION public.email_has_account(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE lower(email) = lower(trim(_email))
  );
$$;

-- Restrict execution to service role only (called from edge functions)
REVOKE ALL ON FUNCTION public.email_has_account(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_has_account(text) TO service_role;

COMMENT ON FUNCTION public.email_has_account(text) IS
  'Returns true if the given email matches an existing auth.users row. Used by send-form-confirmation to differentiate signup vs returning lead emails.';