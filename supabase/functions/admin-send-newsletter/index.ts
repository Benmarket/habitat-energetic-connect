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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
    (r: { role: string }) => r.role === 'super_admin' || r.role === 'admin',
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

  // Resolve target article (latest or explicit)
  async function loadArticle(articleId?: string) {
    let q = admin
      .from('posts')
      .select(
        `id, title, slug, excerpt, content, featured_image, published_at,
         post_categories(categories(name))`,
      )
      .eq('content_type', 'actualite')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1)
    if (articleId) q = q.eq('id', articleId).limit(1)
    const { data } = await q
    return data?.[0]
  }

  async function loadLatest3() {
    const { data } = await admin
      .from('posts')
      .select(
        `id, title, slug, excerpt, content, featured_image, published_at,
         post_categories(categories(name))`,
      )
      .eq('content_type', 'actualite')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3)
    return (data || []).map((p: any) => ({
      title: p.title,
      excerpt: p.excerpt || undefined,
      url: `${SITE_URL}/actualites/${p.slug}`,
      imageUrl: p.featured_image || undefined,
      categoryLabel: p.post_categories?.[0]?.categories?.name || 'Actualités',
      publishedAtLabel: formatDateLabel(p.published_at),
      readingTime: estimateReadingTime(p.content),
    }))
  }

  if (body.action === 'test_welcome') {
    if (!body.recipientEmail) {
      return new Response(JSON.stringify({ error: 'recipientEmail required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const articles = await loadLatest3()
    const { data: sendResult, error } = await admin.functions.invoke(
      'send-transactional-email',
      {
        body: {
          templateName: 'newsletter-subscription-confirmation',
          recipientEmail: body.recipientEmail,
          idempotencyKey: `newsletter-welcome-test-${Date.now()}-${body.recipientEmail}`,
          templateData: {
            firstName: body.firstName,
            recipientEmail: body.recipientEmail,
            articles,
          },
        },
      },
    )
    if (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ success: true, sent: sendResult }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (body.action === 'test_new_article' || body.action === 'broadcast_new_article') {
    const post = await loadArticle(body.articleId)
    if (!post) {
      return new Response(JSON.stringify({ error: 'no_article_found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const p: any = post
    const templateData = {
      articleTitle: p.title,
      articleExcerpt: p.excerpt || undefined,
      articleImageUrl: p.featured_image || undefined,
      articleUrl: `${SITE_URL}/actualites/${p.slug}`,
      categoryLabel: p.post_categories?.[0]?.categories?.name || 'Actualités',
      readingTime: estimateReadingTime(p.content),
      publishedAtLabel: formatDateLabel(p.published_at),
    }

    if (body.action === 'test_new_article') {
      if (!body.recipientEmail) {
        return new Response(JSON.stringify({ error: 'recipientEmail required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const { data: sendResult, error } = await admin.functions.invoke(
        'send-transactional-email',
        {
          body: {
            templateName: 'newsletter-new-article',
            recipientEmail: body.recipientEmail,
            idempotencyKey: `newsletter-article-test-${p.id}-${Date.now()}-${body.recipientEmail}`,
            templateData: {
              ...templateData,
              firstName: body.firstName,
              recipientEmail: body.recipientEmail,
            },
          },
        },
      )
      if (error) {
        return new Response(JSON.stringify({ error: String(error) }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ success: true, sent: sendResult, article: p.title }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // broadcast — active subscribers only
    const { data: subs } = await admin
      .from('newsletter_subscribers')
      .select('email')
      .eq('status', 'active')
    let sent = 0
    let failed = 0
    for (const s of subs || []) {
      const { error } = await admin.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'newsletter-new-article',
          recipientEmail: s.email,
          idempotencyKey: `newsletter-article-${p.id}-${s.email}`,
          templateData: {
            ...templateData,
            recipientEmail: s.email,
          },
        },
      })
      if (error) failed++
      else sent++
    }
    return new Response(JSON.stringify({ success: true, sent, failed, article: p.title }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ error: 'unknown_action' }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
