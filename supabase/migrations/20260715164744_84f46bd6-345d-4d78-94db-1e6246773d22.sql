
-- =========================================================
-- Tables
-- =========================================================
CREATE TABLE public.simulator_tracking_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  simulator_id text NOT NULL,
  session_key text NOT NULL,
  visitor_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text,
  fingerprint text,
  ip_hash text,
  user_agent text,
  referrer_url text,
  referrer_source text,
  landing_url text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  total_steps int NOT NULL DEFAULT 8,
  max_step int NOT NULL DEFAULT 0,
  max_step_label text,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  abandoned_at_step int,
  last_event_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT, UPDATE ON public.simulator_tracking_sessions TO anon, authenticated;
GRANT SELECT ON public.simulator_tracking_sessions TO authenticated;
GRANT ALL ON public.simulator_tracking_sessions TO service_role;

ALTER TABLE public.simulator_tracking_sessions ENABLE ROW LEVEL SECURITY;

-- Admin read
CREATE POLICY "Admins can read simulator sessions"
ON public.simulator_tracking_sessions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Anyone (anon+auth) can insert their own row
CREATE POLICY "Anyone can create tracking session"
ON public.simulator_tracking_sessions FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Anyone can update rows created in the last 24h (mise à jour d'étape max, complétion, etc.)
CREATE POLICY "Anyone can update recent tracking session"
ON public.simulator_tracking_sessions FOR UPDATE
TO anon, authenticated
USING (created_at > now() - INTERVAL '24 hours')
WITH CHECK (created_at > now() - INTERVAL '24 hours');

CREATE INDEX idx_sim_track_sessions_sim ON public.simulator_tracking_sessions(simulator_id, created_at DESC);
CREATE INDEX idx_sim_track_sessions_key ON public.simulator_tracking_sessions(session_key);
CREATE INDEX idx_sim_track_sessions_visitor ON public.simulator_tracking_sessions(visitor_id);
CREATE INDEX idx_sim_track_sessions_source ON public.simulator_tracking_sessions(referrer_source);

CREATE TRIGGER trg_sim_track_sessions_updated
BEFORE UPDATE ON public.simulator_tracking_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------
CREATE TABLE public.simulator_tracking_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.simulator_tracking_sessions(id) ON DELETE CASCADE,
  simulator_id text NOT NULL,
  event_type text NOT NULL,
  step int,
  step_label text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.simulator_tracking_events TO anon, authenticated;
GRANT SELECT ON public.simulator_tracking_events TO authenticated;
GRANT ALL ON public.simulator_tracking_events TO service_role;

ALTER TABLE public.simulator_tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read simulator events"
ON public.simulator_tracking_events FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can insert events"
ON public.simulator_tracking_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE INDEX idx_sim_track_events_session ON public.simulator_tracking_events(session_id, created_at);
CREATE INDEX idx_sim_track_events_sim ON public.simulator_tracking_events(simulator_id, created_at DESC);
CREATE INDEX idx_sim_track_events_type ON public.simulator_tracking_events(event_type);

-- =========================================================
-- Aggregation RPC (admin only)
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_simulator_tracking_stats(
  p_simulator_id text,
  p_start timestamptz,
  p_end timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_total int;
  v_completed int;
  v_unique_visitors int;
  v_returning int;
  v_avg_step numeric;
  v_funnel jsonb;
  v_sources jsonb;
  v_timeline jsonb;
  v_sessions jsonb;
BEGIN
  -- Auth guard
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE completed),
         COUNT(DISTINCT session_key),
         AVG(max_step)
  INTO v_total, v_completed, v_unique_visitors, v_avg_step
  FROM public.simulator_tracking_sessions
  WHERE simulator_id = p_simulator_id
    AND created_at BETWEEN p_start AND p_end;

  -- Returning visitors (session_key with >1 sessions in range)
  SELECT COUNT(*) INTO v_returning FROM (
    SELECT session_key FROM public.simulator_tracking_sessions
    WHERE simulator_id = p_simulator_id AND created_at BETWEEN p_start AND p_end
    GROUP BY session_key HAVING COUNT(*) > 1
  ) t;

  -- Funnel (visitors reaching each step)
  SELECT jsonb_agg(row_to_json(f) ORDER BY step)
  INTO v_funnel
  FROM (
    SELECT s.step,
           COUNT(*) FILTER (WHERE sess.max_step >= s.step) AS reached,
           COUNT(*) FILTER (WHERE sess.max_step = s.step AND NOT sess.completed) AS abandoned_here
    FROM generate_series(1, 9) AS s(step)
    CROSS JOIN public.simulator_tracking_sessions sess
    WHERE sess.simulator_id = p_simulator_id
      AND sess.created_at BETWEEN p_start AND p_end
    GROUP BY s.step
  ) f;

  -- Sources
  SELECT jsonb_agg(row_to_json(src) ORDER BY sessions DESC)
  INTO v_sources
  FROM (
    SELECT COALESCE(referrer_source, 'direct') AS source,
           COUNT(*) AS sessions,
           COUNT(*) FILTER (WHERE completed) AS completions
    FROM public.simulator_tracking_sessions
    WHERE simulator_id = p_simulator_id
      AND created_at BETWEEN p_start AND p_end
    GROUP BY 1
  ) src;

  -- Timeline (daily)
  SELECT jsonb_agg(row_to_json(t) ORDER BY day)
  INTO v_timeline
  FROM (
    SELECT date_trunc('day', created_at)::date AS day,
           COUNT(*) AS sessions,
           COUNT(*) FILTER (WHERE completed) AS completions,
           COUNT(*) FILTER (WHERE NOT completed AND max_step > 0) AS abandons
    FROM public.simulator_tracking_sessions
    WHERE simulator_id = p_simulator_id
      AND created_at BETWEEN p_start AND p_end
    GROUP BY 1
  ) t;

  -- Detailed session list (max 500) with returning info
  SELECT jsonb_agg(row_to_json(s))
  INTO v_sessions
  FROM (
    SELECT sess.id,
           sess.session_key,
           sess.visitor_id,
           sess.user_id,
           sess.email,
           sess.referrer_source,
           sess.referrer_url,
           sess.utm_source,
           sess.utm_medium,
           sess.utm_campaign,
           sess.landing_url,
           sess.user_agent,
           sess.max_step,
           sess.max_step_label,
           sess.completed,
           sess.completed_at,
           sess.abandoned_at_step,
           sess.created_at,
           sess.last_event_at,
           (SELECT COUNT(*) FROM public.simulator_tracking_sessions o
              WHERE o.session_key = sess.session_key AND o.simulator_id = sess.simulator_id) AS total_attempts,
           (SELECT MIN(o.created_at) FROM public.simulator_tracking_sessions o
              WHERE o.session_key = sess.session_key AND o.simulator_id = sess.simulator_id) AS first_seen
    FROM public.simulator_tracking_sessions sess
    WHERE sess.simulator_id = p_simulator_id
      AND sess.created_at BETWEEN p_start AND p_end
    ORDER BY sess.created_at DESC
    LIMIT 500
  ) s;

  v_result := jsonb_build_object(
    'total_sessions', COALESCE(v_total, 0),
    'completions', COALESCE(v_completed, 0),
    'completion_rate', CASE WHEN v_total > 0 THEN ROUND((v_completed::numeric / v_total) * 100, 1) ELSE 0 END,
    'abandon_rate', CASE WHEN v_total > 0 THEN ROUND(((v_total - v_completed)::numeric / v_total) * 100, 1) ELSE 0 END,
    'unique_visitors', COALESCE(v_unique_visitors, 0),
    'returning_visitors', COALESCE(v_returning, 0),
    'avg_step_reached', COALESCE(ROUND(v_avg_step, 2), 0),
    'funnel', COALESCE(v_funnel, '[]'::jsonb),
    'sources', COALESCE(v_sources, '[]'::jsonb),
    'timeline', COALESCE(v_timeline, '[]'::jsonb),
    'sessions', COALESCE(v_sessions, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_simulator_tracking_stats(text, timestamptz, timestamptz) TO authenticated;
