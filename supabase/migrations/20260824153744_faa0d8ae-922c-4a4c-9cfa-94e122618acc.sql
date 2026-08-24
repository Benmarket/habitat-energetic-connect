-- La vue admin est remplacée : l'email de contact reste lisible par les comptes
-- connectés (l'interface d'administration en a besoin) mais plus par les visiteurs.
DROP VIEW IF EXISTS public.advertisers_admin;
GRANT SELECT (contact_email) ON public.advertisers TO authenticated;