-- Add explicit deny-all policy to visitor_sessions (accessed only via SECURITY DEFINER functions)
-- This resolves the "RLS enabled but no policy" linter warning

CREATE POLICY "No direct access to visitor_sessions"
ON public.visitor_sessions
FOR ALL
USING (false)
WITH CHECK (false);
