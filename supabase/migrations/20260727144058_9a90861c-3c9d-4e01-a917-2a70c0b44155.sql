
DROP POLICY IF EXISTS "Anyone can update recent tracking session" ON public.simulator_tracking_sessions;

CREATE POLICY "Anon can update own anonymous recent session"
ON public.simulator_tracking_sessions
FOR UPDATE
TO anon
USING (
  created_at > now() - interval '24 hours'
  AND user_id IS NULL
)
WITH CHECK (
  created_at > now() - interval '24 hours'
  AND user_id IS NULL
);

CREATE POLICY "Authenticated can update own recent session"
ON public.simulator_tracking_sessions
FOR UPDATE
TO authenticated
USING (
  created_at > now() - interval '24 hours'
  AND (user_id IS NULL OR user_id = auth.uid())
)
WITH CHECK (
  created_at > now() - interval '24 hours'
  AND (user_id IS NULL OR user_id = auth.uid())
);
