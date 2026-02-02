
-- Ajouter policy INSERT pour ai_rate_limits (via service_role uniquement, pas de policy directe nécessaire)
-- Mais on doit permettre l'insertion via la fonction record_ai_call qui est SECURITY DEFINER

-- Policy pour permettre les insertions via les fonctions SECURITY DEFINER
-- Note: Les fonctions SECURITY DEFINER s'exécutent avec les droits du propriétaire (postgres)
-- donc elles bypassent RLS. Pas besoin de policy INSERT supplémentaire.

-- Pour éviter l'avertissement du linter, on ajoute une policy INSERT vide qui sera bypassée par SECURITY DEFINER
CREATE POLICY "No direct insert on ai_rate_limits"
ON public.ai_rate_limits
FOR INSERT
WITH CHECK (false);

-- Policy DELETE pour le nettoyage automatique (via SECURITY DEFINER)
CREATE POLICY "No direct delete on ai_rate_limits"
ON public.ai_rate_limits
FOR DELETE
USING (false);
