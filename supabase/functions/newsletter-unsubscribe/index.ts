import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function normalizeEmail(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const email = input.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null
  return email
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Server configuration error' }, 500)
  }

  let email: string | null = null
  try {
    const body = await req.json()
    email = normalizeEmail(body?.email)
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  if (!email) {
    return json({ error: 'Adresse email invalide' }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Mark newsletter subscriber as unsubscribed (idempotent)
  const { data: existing, error: findErr } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .eq('email', email)
    .maybeSingle()

  if (findErr) {
    console.error('newsletter-unsubscribe find error', findErr)
    return json({ error: 'Erreur serveur' }, 500)
  }

  if (!existing) {
    // Nothing to unsubscribe: still succeed silently to avoid email enumeration.
    return json({ success: true, alreadyUnsubscribed: true })
  }

  const nowIso = new Date().toISOString()
  const { error: updErr } = await supabase
    .from('newsletter_subscribers')
    .update({
      status: 'unsubscribed',
      unsubscribed_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', existing.id)

  if (updErr) {
    console.error('newsletter-unsubscribe update error', updErr)
    return json({ error: 'Erreur serveur' }, 500)
  }

  return json({
    success: true,
    alreadyUnsubscribed: existing.status === 'unsubscribed',
  })
})
