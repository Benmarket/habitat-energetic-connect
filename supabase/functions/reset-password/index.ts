// Edge function: reset-password
// Public (verify_jwt = false).
// GET ?token=...  → validates the token (without consuming).
// POST { token, password } → consumes token + updates the user's password.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

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
      .from('password_reset_tokens')
      .select('email, expires_at, used_at')
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

    return new Response(JSON.stringify({ valid: true, email: row.email }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

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
  if (!token || !password || password.length < 8 || !/[A-Z]/.test(password)) {
    return new Response(
      JSON.stringify({
        error: 'invalid_input',
        message: 'Mot de passe invalide (8 caractères minimum, 1 majuscule).',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const tokenHash = await sha256Hex(token)
  const { data: row } = await admin
    .from('password_reset_tokens')
    .select('id, user_id, email, expires_at, used_at')
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

  // Update the user password
  const { error: updErr } = await admin.auth.admin.updateUserById(row.user_id, {
    password,
  })
  if (updErr) {
    console.error('[reset-password] update failed:', updErr)
    return new Response(JSON.stringify({ error: 'update_failed', detail: updErr.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Mark token used
  await admin
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', row.id)

  return new Response(JSON.stringify({ success: true, email: row.email }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
