-- Allow anon to SELECT their own recent anonymous rows so PostgREST can locate them for UPDATE.
-- Rows are identified by opaque UUIDs (not enumerable) and only exist for 24h in this scope.
CREATE POLICY "Anon can read own anonymous recent session"
ON public.simulator_tracking_sessions
FOR SELECT
TO anon
USING (created_at > (now() - interval '24 hours') AND user_id IS NULL);