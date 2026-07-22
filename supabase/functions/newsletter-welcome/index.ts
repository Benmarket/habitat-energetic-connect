// Public edge function: called after a successful newsletter subscription
// (footer form). Fetches the 3 latest published articles server-side, then
// invokes send-transactional-email using the service_role.
// Rate-limited per IP to prevent abuse (public endpoint).

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://prime-energies.fr'

interface Body {
  email: string
  firstName?: string
}

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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(supabaseUrl, serviceKey)

  // Rate limit per IP: 5 / hour
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('cf-connecting-ip') || ''
  if (ip) {
    const { data: allowed } = await admin.rpc('check_edge_rate', {
      p_identifier: ip,
      p_endpoint: 'newsletter-welcome',
      p_max_per_hour: 5,
    })
    if (allowed === false) {
      return new Response(JSON.stringify({ error: 'rate_limited' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    admin.rpc('record_edge_call', {
      p_identifier: ip,
      p_endpoint: 'newsletter-welcome',
    }).then(() => {})
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email) {
    return new Response(JSON.stringify({ error: 'Missing email' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Confirm the subscriber actually exists & is active — anti-abuse
  const { data: sub } = await admin
    .from('newsletter_subscribers')
    .select('email, status')
    .eq('email', email)
    .maybeSingle()
  if (!sub || sub.status !== 'active') {
    return new Response(JSON.stringify({ error: 'not_subscribed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Fetch 3 latest published articles
  const { data: posts } = await admin
    .from('posts')
    .select(`id, title, slug, excerpt, content, featured_image, published_at,
             post_categories(categories(name, slug))`)
    .eq('content_type', 'actualite')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(3)

  const articles = (posts || []).map((p: any) => {
    const cat = p.post_categories?.[0]?.categories
    const catSlug = cat?.slug || 'actualites'
    return {
      title: p.title,
      excerpt: p.excerpt || undefined,
      url: `${SITE_URL}/actualites/${catSlug}/${p.slug}`,
      imageUrl: p.featured_image || undefined,
      categoryLabel: cat?.name || 'Actualités',
      publishedAtLabel: formatDateLabel(p.published_at),
      readingTime: estimateReadingTime(p.content),
    }
  })

  const { data: sendResult, error: sendErr } = await admin.functions.invoke(
    'send-transactional-email',
    {
      body: {
        templateName: 'newsletter-subscription-confirmation',
        recipientEmail: email,
        idempotencyKey: `newsletter-welcome-${email}`,
        templateData: {
          firstName: body.firstName,
          recipientEmail: email,
          articles,
        },
      },
    },
  )

  if (sendErr) {
    console.error('[newsletter-welcome] send failed', sendErr)
    return new Response(JSON.stringify({ error: 'send_failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true, sent: sendResult }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
