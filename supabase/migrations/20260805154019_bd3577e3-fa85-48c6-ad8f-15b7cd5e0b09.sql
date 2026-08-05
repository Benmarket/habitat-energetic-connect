-- Remove all direct visitor access to tracking tables; writes now go through the
-- service-role edge function "track-simulator".
DROP POLICY IF EXISTS "Anon can read own anonymous recent session" ON public.simulator_tracking_sessions;
DROP POLICY IF EXISTS "Anonymous can update own recent anonymous session" ON public.simulator_tracking_sessions;
DROP POLICY IF EXISTS "Authenticated can update own recent session" ON public.simulator_tracking_sessions;
DROP POLICY IF EXISTS "Anyone can update recent tracking session" ON public.simulator_tracking_sessions;
DROP POLICY IF EXISTS "Anyone can insert tracking session" ON public.simulator_tracking_sessions;
DROP POLICY IF EXISTS "Anyone can insert tracking event" ON public.simulator_tracking_events;

REVOKE INSERT, UPDATE, SELECT ON public.simulator_tracking_sessions FROM anon, authenticated;
REVOKE INSERT, UPDATE, SELECT ON public.simulator_tracking_events FROM anon, authenticated;

GRANT SELECT ON public.simulator_tracking_sessions TO authenticated;
GRANT SELECT ON public.simulator_tracking_events TO authenticated;
GRANT ALL ON public.simulator_tracking_sessions TO service_role;
GRANT ALL ON public.simulator_tracking_events TO service_role;