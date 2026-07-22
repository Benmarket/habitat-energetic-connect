// Public edge function: one-click newsletter subscription from a link
// contained in a lead confirmation email. Inserts the subscriber if new,
// then triggers the standard welcome email (best-effort).
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface Body { email: string; firstName?: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('cf-connecting-ip') || ''
  if (ip) {
    const { data: allowed } = await admin.rpc('check_edge_rate', {
      p_identifier: ip,
      p_endpoint: 'newsletter-one-click',
      p_max_per_hour: 20,
    })
    if (allowed === false) {
      return new Response(JSON.stringify({ error: 'rate_limited' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    admin.rpc('record_edge_call', {
      p_identifier: ip,
      p_endpoint: 'newsletter-one-click',
    }).then(() => {})
  }

  let body: Body
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const email = body.email?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'invalid_email' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Check existing
  const { data: existing } = await admin
    .from('newsletter_subscribers')
    .select('email, status')
    .eq('email', email)
    .maybeSingle()

  let alreadyActive = false
  if (existing) {
    if (existing.status === 'active') {
      alreadyActive = true
    } else {
      // reactivate
      await admin.from('newsletter_subscribers')
        .update({ status: 'active', unsubscribed_at: null })
        .eq('email', email)
    }
  } else {
    const { error: insErr } = await admin.from('newsletter_subscribers').insert({
      email,
      source: 'email-lead-cta',
      status: 'active',
      consent: {
        method: 'one-click-email',
        timestamp: new Date().toISOString(),
        ip: ip || null,
      },
    })
    if (insErr) {
      console.error('[newsletter-one-click] insert failed', insErr)
      return new Response(JSON.stringify({ error: 'insert_failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  // Fire welcome (skip if already active — avoid duplicates)
  if (!alreadyActive) {
    admin.functions.invoke('newsletter-welcome', {
      body: { email, firstName: body.firstName },
    }).catch((e) => console.warn('welcome invoke failed', e))
  }

  return new Response(JSON.stringify({ success: true, alreadyActive }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
