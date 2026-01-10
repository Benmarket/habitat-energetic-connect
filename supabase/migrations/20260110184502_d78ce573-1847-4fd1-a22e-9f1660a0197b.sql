-- 1. Supprimer l'ancienne contrainte CHECK
ALTER TABLE public.chat_conversations 
DROP CONSTRAINT IF EXISTS chat_conversations_status_check;

-- 2. Créer la nouvelle contrainte avec tous les statuts utilisés dans le code
ALTER TABLE public.chat_conversations 
ADD CONSTRAINT chat_conversations_status_check 
CHECK (status = ANY (ARRAY[
  'active'::text, 
  'closed'::text, 
  'awaiting_agent'::text,
  'qualified'::text,
  'completed'::text,
  'abandoned'::text,
  'expired'::text
]));