-- 1) Retirer l'exposition publique de form_configurations (webhook_url etc.)
--    Les pages publiques utilisent déjà la vue form_configurations_public.
DROP POLICY IF EXISTS "Public can view non-sensitive form config" ON public.form_configurations;

-- 2) Retirer la possibilité pour les visiteurs anonymes de modifier un lead récent.
--    Cette étape (renseignement du nom après la simulation solaire) passe désormais
--    par l'edge function sécurisée update-lead-name (service role + garde-fous).
DROP POLICY IF EXISTS "Anon can complete recent lead name" ON public.leads;