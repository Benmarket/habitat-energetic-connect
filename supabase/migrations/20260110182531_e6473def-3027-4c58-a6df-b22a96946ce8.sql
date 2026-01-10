-- 1. Enrichir chat_conversations avec métadonnées et parcours
ALTER TABLE public.chat_conversations
ADD COLUMN IF NOT EXISTS flow_id uuid REFERENCES public.chatbot_flows(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS flow_responses jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS page_url text,
ADD COLUMN IF NOT EXISTS referrer text,
ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS closed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS closed_reason text;

-- 2. Enrichir chat_agent_requests pour le timeout et tracking
ALTER TABLE public.chat_agent_requests
ADD COLUMN IF NOT EXISTS expired_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS timeout_minutes integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS notified_user boolean DEFAULT false;

-- 3. Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_chat_conversations_flow_id ON public.chat_conversations(flow_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_status ON public.chat_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created_at ON public.chat_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_agent_requests_status ON public.chat_agent_requests(status);
CREATE INDEX IF NOT EXISTS idx_chat_agent_requests_created_at ON public.chat_agent_requests(created_at DESC);

-- 4. Fonction pour auto-expirer les demandes après timeout
CREATE OR REPLACE FUNCTION public.expire_stale_agent_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Expire les demandes en attente depuis plus de timeout_minutes
  UPDATE chat_agent_requests
  SET 
    status = 'expired',
    expired_at = NOW()
  WHERE 
    status = 'pending'
    AND created_at < NOW() - (COALESCE(timeout_minutes, 10) * INTERVAL '1 minute');
    
  -- Met à jour les conversations correspondantes
  UPDATE chat_conversations c
  SET 
    status = 'expired',
    closed_at = NOW(),
    closed_reason = 'timeout'
  FROM chat_agent_requests r
  WHERE 
    c.id = r.conversation_id
    AND r.status = 'expired'
    AND c.status = 'awaiting_agent';
END;
$$;

-- 5. Fonction pour marquer les conversations abandonnées (pas de heartbeat depuis 2 min)
CREATE OR REPLACE FUNCTION public.mark_abandoned_conversations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Marque comme abandonnées les conversations sans heartbeat récent
  UPDATE chat_conversations
  SET 
    status = 'abandoned',
    closed_at = NOW(),
    closed_reason = 'no_heartbeat'
  WHERE 
    status IN ('awaiting_agent', 'active')
    AND last_seen_at IS NOT NULL
    AND last_seen_at < NOW() - INTERVAL '2 minutes';
    
  -- Expire les demandes d'agent correspondantes
  UPDATE chat_agent_requests r
  SET status = 'abandoned'
  FROM chat_conversations c
  WHERE 
    r.conversation_id = c.id
    AND r.status = 'pending'
    AND c.status = 'abandoned';
END;
$$;