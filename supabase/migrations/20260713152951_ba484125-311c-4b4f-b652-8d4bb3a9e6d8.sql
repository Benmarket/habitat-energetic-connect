-- Supprime les policies trop permissives sur realtime.messages
DROP POLICY IF EXISTS "Authenticated users can receive broadcasts" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can send broadcasts" ON realtime.messages;

-- Autorise presence + postgres_changes pour tous les authentifiés, mais bloque broadcast sauf pour admins
CREATE POLICY "Realtime read - presence and db changes, broadcast admin only"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    extension IN ('presence', 'postgres_changes')
    OR (
      extension = 'broadcast'
      AND (
        public.has_role(auth.uid(), 'admin'::app_role)
        OR public.has_role(auth.uid(), 'super_admin'::app_role)
      )
    )
  );

CREATE POLICY "Realtime write - presence only, broadcast admin only"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    extension = 'presence'
    OR (
      extension = 'broadcast'
      AND (
        public.has_role(auth.uid(), 'admin'::app_role)
        OR public.has_role(auth.uid(), 'super_admin'::app_role)
      )
    )
  );