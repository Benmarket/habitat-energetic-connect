-- Cette fonction est appelée par l'espace d'administration du chat et contrôle
-- elle-même le rôle de l'appelant : elle doit rester accessible aux comptes connectés.
GRANT EXECUTE ON FUNCTION public.mark_abandoned_conversations() TO authenticated;