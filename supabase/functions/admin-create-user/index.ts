// Edge function: admin-create-user
// Admin only. Creates a new user account from the admin UI (Gestion utilisateurs).

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userRes } = await userClient.auth.getUser()
  if (!userRes?.user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const { data: roles } = await admin.from('user_roles').select('role').eq('user_id', userRes.user.id)
  const isAdmin = (roles || []).some((r: any) => r.role === 'admin' || r.role === 'super_admin')
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: { email?: string; password?: string; firstName?: string; lastName?: string; phone?: string; role?: string; accountType?: string }
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { email, password, firstName, lastName, phone, role, accountType } = body
  if (!email || !password || password.length < 8 || !/[A-Z]/.test(password)) {
    return new Response(JSON.stringify({ error: 'invalid_input', message: 'Email + mot de passe (8 car. min, 1 maj.) requis.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName || null,
      last_name: lastName || null,
      phone: phone || null,
      account_type: accountType || 'particulier',
    },
  })
  if (createErr || !created?.user) {
    return new Response(JSON.stringify({ error: 'create_failed', detail: createErr?.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Optionally override role
  if (role && role !== 'user') {
    await admin.from('user_roles').upsert({ user_id: created.user.id, role }, { onConflict: 'user_id,role' })
  }

  return new Response(JSON.stringify({ success: true, userId: created.user.id }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
