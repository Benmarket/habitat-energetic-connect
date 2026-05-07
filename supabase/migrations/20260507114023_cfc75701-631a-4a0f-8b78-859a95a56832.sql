
CREATE OR REPLACE FUNCTION public.phone_already_used(_phone text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE phone IS NOT NULL AND phone <> '' AND phone = _phone
  );
$$;

CREATE OR REPLACE FUNCTION public.email_already_used(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE lower(email) = lower(_email)
  );
$$;

GRANT EXECUTE ON FUNCTION public.phone_already_used(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.email_already_used(text) TO anon, authenticated;
