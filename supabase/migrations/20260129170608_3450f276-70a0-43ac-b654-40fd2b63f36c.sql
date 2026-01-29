-- ============================================================
-- PHASE 1.3 : SÉCURISATION CHAT VISITEUR (Option B - Session Serveur)
-- ============================================================

-- 1. TABLE visitor_sessions
CREATE TABLE IF NOT EXISTS public.visitor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_token_hash ON public.visitor_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_expires ON public.visitor_sessions(expires_at);

-- Hardening : forcer RLS et révoquer tout accès direct
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_sessions FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.visitor_sessions FROM anon, authenticated;

-- 2. FONCTION issue_visitor_session (émission de session)
CREATE OR REPLACE FUNCTION public.issue_visitor_session(p_expires_in_seconds int DEFAULT 86400)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_visitor_id text;
  v_token text;
  v_token_hash text;
  v_expires_at timestamptz;
BEGIN
  -- Générer identifiants
  v_visitor_id := 'visitor_' || replace(gen_random_uuid()::text, '-', '');
  v_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(digest(v_token, 'sha256'), 'hex');
  v_expires_at := now() + (p_expires_in_seconds || ' seconds')::interval;
  
  -- Insérer la session (la fonction a les droits via SECURITY DEFINER)
  INSERT INTO public.visitor_sessions (visitor_id, token_hash, expires_at)
  VALUES (v_visitor_id, v_token_hash, v_expires_at);
  
  -- Retourner visitor_id + token (le token n'est jamais stocké en clair)
  RETURN jsonb_build_object(
    'visitor_id', v_visitor_id,
    'token', v_token,
    'expires_at', v_expires_at
  );
END;
$$;

-- Hardening : révoquer puis autoriser uniquement anon/authenticated
REVOKE ALL ON FUNCTION public.issue_visitor_session(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_visitor_session(int) TO anon, authenticated;

-- 3. FONCTION current_visitor_id (validation du token)
CREATE OR REPLACE FUNCTION public.current_visitor_id()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
  v_token_hash text;
  v_visitor_id text;
BEGIN
  -- Extraire le token du header
  v_token := current_setting('request.headers', true)::json->>'x-visitor-token';
  
  IF v_token IS NULL OR v_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Calculer le hash et chercher la session valide
  v_token_hash := encode(digest(v_token, 'sha256'), 'hex');
  
  SELECT visitor_id INTO v_visitor_id
  FROM public.visitor_sessions
  WHERE token_hash = v_token_hash
    AND expires_at > now();
  
  RETURN v_visitor_id;
END;
$$;

-- Hardening : révoquer puis autoriser pour RLS
REVOKE ALL ON FUNCTION public.current_visitor_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_visitor_id() TO anon, authenticated;

-- ============================================================
-- 4. POLICIES chat_conversations
-- ============================================================

-- Supprimer toutes les anciennes policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Visitors can view their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Visitors can create conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Visitors can update their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can update conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.chat_conversations;

-- ADMIN policies
CREATE POLICY "Admins can view all conversations"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins can update conversations"
ON public.chat_conversations
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role)
);

-- AUTHENTICATED users (non-admin)
CREATE POLICY "Users can view their own conversations"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own conversations"
ON public.chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND visitor_id IS NULL);

CREATE POLICY "Users can update their own conversations"
ON public.chat_conversations
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- ANONYMOUS visitors (preuve serveur obligatoire)
CREATE POLICY "Visitors can view their own conversations"
ON public.chat_conversations
FOR SELECT
TO anon
USING (visitor_id = public.current_visitor_id() AND visitor_id IS NOT NULL);

CREATE POLICY "Visitors can create conversations"
ON public.chat_conversations
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL AND 
  visitor_id = public.current_visitor_id() AND 
  visitor_id IS NOT NULL
);

CREATE POLICY "Visitors can update their own conversations"
ON public.chat_conversations
FOR UPDATE
TO anon
USING (visitor_id = public.current_visitor_id() AND visitor_id IS NOT NULL);

-- ============================================================
-- 5. POLICIES chat_messages
-- ============================================================

-- Supprimer toutes les anciennes policies
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Visitors can view messages in their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Visitors can create messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can create messages" ON public.chat_messages;

-- ADMIN policies
CREATE POLICY "Admins can view all messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'moderator'::app_role)
);

CREATE POLICY "Admins can create messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_type = 'agent' AND (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'moderator'::app_role)
  )
);

-- AUTHENTICATED users
CREATE POLICY "Users can view messages in their conversations"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_type = 'user' AND
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.user_id = auth.uid()
  )
);

-- ANONYMOUS visitors (preuve serveur obligatoire)
CREATE POLICY "Visitors can view messages in their conversations"
ON public.chat_messages
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.visitor_id = public.current_visitor_id()
      AND c.visitor_id IS NOT NULL
  )
);

CREATE POLICY "Visitors can create messages"
ON public.chat_messages
FOR INSERT
TO anon
WITH CHECK (
  sender_type = 'visitor' AND
  EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = chat_messages.conversation_id
      AND c.visitor_id = public.current_visitor_id()
      AND c.visitor_id IS NOT NULL
  )
);