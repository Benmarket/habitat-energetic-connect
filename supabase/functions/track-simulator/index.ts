// Relay for simulator tracking: all writes go through the service role so that
// visitors can never read or modify another visitor's tracking session.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
)

const str = (v: unknown, max = 500) =>
  typeof v === 'string' && v.length ? v.slice(0, max) : null

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const action = str(body.action, 32)
  const simulator_id = str(body.simulator_id, 100)
  if (!action || !simulator_id) return json({ error: 'Missing action or simulator_id' }, 400)

  // Identify the caller for auditing (never trusted from the payload)
  const ip =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null

  let userId: string | null = null
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const { data } = await admin.auth.getUser(authHeader.replace('Bearer ', ''))
    userId = data.user?.id ?? null
  }

  try {
    if (action === 'start') {
      const { data, error } = await admin
        .from('simulator_tracking_sessions')
        .insert({
          simulator_id,
          session_key: str(body.session_key, 100) ?? crypto.randomUUID(),
          visitor_id: str(body.session_key, 100),
          user_id: userId,
          fingerprint: str(body.fingerprint, 100),
          user_agent: str(req.headers.get('user-agent'), 500),
          ip_hash: ip ? await sha256(ip) : null,
          referrer_url: str(body.referrer_url, 1000),
          referrer_source: str(body.referrer_source, 50),
          landing_url: str(body.landing_url, 1000),
          utm_source: str(body.utm_source, 200),
          utm_medium: str(body.utm_medium, 200),
          utm_campaign: str(body.utm_campaign, 200),
          total_steps: Number(body.total_steps) || 0,
        })
        .select('id')
        .single()
      if (error) throw error

      await admin.from('simulator_tracking_events').insert({
        session_id: data.id,
        simulator_id,
        event_type: 'session_start',
        payload: {
          referrer_source: str(body.referrer_source, 50),
          referrer_url: str(body.referrer_url, 1000),
          utm_source: str(body.utm_source, 200),
          utm_medium: str(body.utm_medium, 200),
          utm_campaign: str(body.utm_campaign, 200),
        },
      })
      return json({ session_id: data.id })
    }

    const session_id = str(body.session_id, 64)
    if (!session_id) return json({ error: 'Missing session_id' }, 400)
    const now = new Date().toISOString()

    if (action === 'step') {
      const step = Number(body.step)
      if (!Number.isFinite(step) || step <= 0) return json({ error: 'Invalid step' }, 400)
      const label = str(body.step_label, 200)

      await admin.from('simulator_tracking_events').insert({
        session_id, simulator_id, event_type: 'step_view', step, step_label: label,
      })
      const { data: current } = await admin
        .from('simulator_tracking_sessions')
        .select('max_step')
        .eq('id', session_id)
        .maybeSingle()
      if (current && step > (current.max_step ?? 0)) {
        await admin
          .from('simulator_tracking_sessions')
          .update({ max_step: step, max_step_label: label, last_event_at: now })
          .eq('id', session_id)
      }
      return json({ ok: true })
    }

    if (action === 'lead') {
      const email = str(body.email, 320)
      if (!email) return json({ error: 'Missing email' }, 400)
      await admin
        .from('simulator_tracking_sessions')
        .update({ email, last_event_at: now })
        .eq('id', session_id)
      await admin.from('simulator_tracking_events').insert({
        session_id, simulator_id, event_type: 'lead_captured', payload: { email },
      })
      return json({ ok: true })
    }

    if (action === 'complete') {
      const totalSteps = Number(body.total_steps) || 0
      await admin
        .from('simulator_tracking_sessions')
        .update({
          completed: true,
          completed_at: now,
          max_step: totalSteps + 1,
          last_event_at: now,
        })
        .eq('id', session_id)
      await admin.from('simulator_tracking_events').insert({
        session_id, simulator_id, event_type: 'completion', step: totalSteps + 1,
      })
      return json({ ok: true })
    }

    if (action === 'abandon') {
      const step = Number(body.step) || null
      await admin
        .from('simulator_tracking_sessions')
        .update({ abandoned_at_step: step, last_event_at: now })
        .eq('id', session_id)
        .eq('completed', false)
      await admin.from('simulator_tracking_events').insert({
        session_id, simulator_id, event_type: 'abandon', step,
        step_label: str(body.step_label, 200), payload: { reason: 'unload' },
      })
      return json({ ok: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (e) {
    console.error('track-simulator error', e)
    return json({ error: 'Tracking failed' }, 500)
  }
})

async function sha256(v: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
