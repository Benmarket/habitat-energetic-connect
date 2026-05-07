
-- Confirm the existing test user so login works
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

-- Unique constraint on phone (case-insensitive, ignoring empty/null)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx
ON public.profiles (phone)
WHERE phone IS NOT NULL AND phone <> '';
