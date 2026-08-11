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
  let token: string | null = null
  try {
    const body = await req.json()
    email = normalizeEmail(body?.email)
    token = typeof body?.token === 'string' ? body.token.trim() : null
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // --- Proof of ownership -------------------------------------------------
  // 1) A per-recipient unsubscribe token (embedded in newsletter emails), or
  // 2) an authenticated session whose email matches the requested address.
  let verifiedEmail: string | null = null

  if (token) {
    const { data: tokenRow } = await supabase
      .from('email_unsubscribe_tokens')
      .select('email')
      .eq('token', token)
      .maybeSingle()
    if (tokenRow?.email) {
      verifiedEmail = normalizeEmail(tokenRow.email)
    }
  }

  if (!verifiedEmail) {
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : null
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (jwt && anonKey && jwt !== anonKey) {
      const { data: claimsData } = await createClient(supabaseUrl, anonKey)
        .auth.getClaims(jwt)
      const claimEmail = normalizeEmail((claimsData?.claims as any)?.email)
      if (claimEmail && (!email || claimEmail === email)) {
        verifiedEmail = claimEmail
      }
    }
  }

  if (!verifiedEmail) {
    return json(
      {
        error:
          "Lien de désinscription invalide ou expiré. Utilisez le lien « Se désinscrire » présent en bas de l'un de nos emails, ou connectez-vous à votre compte.",
      },
      403,
    )
  }

  email = verifiedEmail

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
