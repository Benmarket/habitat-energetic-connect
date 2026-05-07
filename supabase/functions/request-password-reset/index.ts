// Edge function: request-password-reset
// Public (verify_jwt = false). Generates a one-time reset token and emails it
// via send-transactional-email if (and only if) an account exists for the email.
// Always returns the same generic response to avoid account enumeration.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_ORIGIN = 'https://prime-energies.fr'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

  let body: { email?: string; siteOrigin?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const rawEmail = (body.email || '').trim().toLowerCase()
  const origin = body.siteOrigin || DEFAULT_ORIGIN
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null

  // Email format check (light, just to bail early)
  if (!rawEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail)) {
    return new Response(JSON.stringify({ error: 'invalid_email' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const json = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  // Look up the user by email FIRST — do not send anything if no account
  const { data: userId } = await admin.rpc('get_user_id_by_email', { _email: rawEmail })
  if (!userId) {
    return json(200, {
      success: false,
      sent: false,
      reason: 'no_account',
      message: "Aucun compte n'est associé à cette adresse email.",
    })
  }

  // Rate limit (per email + IP, max 5/hour)
  const { data: rateOk } = await admin.rpc('check_password_reset_rate', {
    p_email: rawEmail,
    p_ip: ip,
  })
  if (rateOk === false) {
    return json(429, {
      success: false,
      sent: false,
      reason: 'rate_limited',
      message: 'Trop de demandes récentes. Réessayez dans 1 heure.',
    })
  }

  // Fetch first_name from profiles (best-effort)
  const { data: profile } = await admin
    .from('profiles')
    .select('first_name')
    .eq('id', userId)
    .maybeSingle()

  // Generate + store token
  const rawToken = generateToken()
  const tokenHash = await sha256Hex(rawToken)
  const { error: insertErr } = await admin.from('password_reset_tokens').insert({
    token_hash: tokenHash,
    user_id: userId,
    email: rawEmail,
    ip_address: ip,
  })
  if (insertErr) {
    console.error('[request-password-reset] token insert failed:', insertErr)
    return genericResponse
  }

  const resetUrl = `${origin}/mot-de-passe-oublie?token=${rawToken}`

  // Send email via the transactional pipeline
  const { error: sendErr } = await admin.functions.invoke('send-transactional-email', {
    body: {
      templateName: 'password-reset',
      recipientEmail: rawEmail,
      idempotencyKey: `pwd-reset-${tokenHash}`,
      templateData: {
        firstName: profile?.first_name ?? undefined,
        email: rawEmail,
        resetUrl,
      },
    },
  })
  if (sendErr) {
    console.error('[request-password-reset] send failed:', sendErr)
  }

  return genericResponse
})
