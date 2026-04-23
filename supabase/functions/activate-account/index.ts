// Edge function: activate-account
// Validates a signup activation token and creates the user account in Supabase Auth.
// GET ?token=...  → returns token info (email, firstName, etc.) without consuming
// POST { token, password } → creates the user, marks token used, returns session

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

  // ---- GET: validate token without consuming ----
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    if (!token) {
      return new Response(JSON.stringify({ error: 'missing_token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const tokenHash = await sha256Hex(token)
    const { data: row } = await admin
      .from('signup_activation_tokens')
      .select('email, first_name, last_name, phone, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (!row) {
      return new Response(JSON.stringify({ error: 'invalid_token' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (row.used_at) {
      return new Response(JSON.stringify({ error: 'already_used', email: row.email }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (new Date(row.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'expired' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(
      JSON.stringify({
        valid: true,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  // ---- POST: consume token + create account ----
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: { token?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { token, password } = body
  if (!token || !password || password.length < 8) {
    return new Response(
      JSON.stringify({ error: 'invalid_input', message: 'Token et mot de passe (min 8 car.) requis' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }

  const tokenHash = await sha256Hex(token)
  const { data: row } = await admin
    .from('signup_activation_tokens')
    .select('id, email, first_name, last_name, phone, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (!row) {
    return new Response(JSON.stringify({ error: 'invalid_token' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (row.used_at) {
    return new Response(JSON.stringify({ error: 'already_used' }), {
      status: 410,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (new Date(row.expires_at) < new Date()) {
    return new Response(JSON.stringify({ error: 'expired' }), {
      status: 410,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Create the user (email_confirm: true since they came from a magic email link)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: row.email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: row.first_name,
      last_name: row.last_name,
      phone: row.phone,
      account_type: 'particulier',
    },
  })

  if (createErr) {
    // If user already exists, mark token used and tell client to log in
    if (createErr.message?.toLowerCase().includes('already')) {
      await admin
        .from('signup_activation_tokens')
        .update({ used_at: new Date().toISOString() })
        .eq('id', row.id)
      return new Response(
        JSON.stringify({ error: 'user_exists', email: row.email }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    console.error('createUser failed:', createErr)
    return new Response(JSON.stringify({ error: 'create_failed', detail: createErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Mark token used
  await admin
    .from('signup_activation_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', row.id)

  return new Response(
    JSON.stringify({ success: true, email: row.email, userId: created.user?.id }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
