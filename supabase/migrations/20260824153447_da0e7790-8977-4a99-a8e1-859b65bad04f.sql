-- Le statut « expiré » est utilisé par la fonction d'expiration mais était refusé.
ALTER TABLE public.chat_agent_requests DROP CONSTRAINT IF EXISTS chat_agent_requests_status_check;
ALTER TABLE public.chat_agent_requests
  ADD CONSTRAINT chat_agent_requests_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'closed'::text, 'expired'::text]));