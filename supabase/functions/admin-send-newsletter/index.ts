// Admin-only edge function to send newsletter emails (test or broadcast).
// Actions:
//   - "test_new_article": sends the "newsletter-new-article" template
//       for the latest published article to a single recipient.
//   - "test_welcome": sends the "newsletter-subscription-confirmation"
//       template (with 3 latest articles) to a single recipient.
//   - "broadcast_new_article": sends the latest article notification
//       to every active newsletter subscriber (throttled via the queue).
//
// Auth: requires a Supabase JWT belonging to a super_admin/admin user.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://prime-energies.fr'

function formatDateLabel(iso: string | null): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 0) return "Publié aujourd'hui"
    if (diff === 1) return 'Il y a 1 jour'
    if (diff < 30) return `Il y a ${diff} jours`
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return ''
  }
}

function estimateReadingTime(content: unknown): string {
  if (typeof content !== 'string') return '3 min'
  const words = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  const minutes = Math.max(2, Math.round(words / 220))
  return `${minutes} min`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !anonKey || !serviceKey) return new Response('Configuration missing', { status: 500, headers: corsHeaders })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userRes, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userRes?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(supabaseUrl, serviceKey)
  const { data: roles } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', userRes.user.id)
  const isAdmin = (roles || []).some(
    (r: { role: string }) => r.role === 'super_admin',
  )
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: {
    action: 'test_new_article' | 'test_welcome' | 'broadcast_new_article'
    recipientEmail?: string
    articleId?: string
    firstName?: string
  }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Newsletter campaigns must not use the individual app-email service.
  return new Response(JSON.stringify({ error: 'newsletter_provider_required', message: 'Un service newsletter dédié doit être connecté. Aucun email envoyé.' }), {
    status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

})
