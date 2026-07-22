// Email tracking endpoint: serves the open pixel and handles click redirects.
// Public (no auth) — pixel and click links live in emails opened by anyone.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 1x1 transparent GIF
const PIXEL = Uint8Array.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00,
  0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00,
  0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02,
  0x44, 0x01, 0x00, 0x3b,
])

function pixelResponse() {
  return new Response(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    },
  })
}

function getClientIp(req: Request): string | null {
  const cf = req.headers.get('cf-connecting-ip')
  if (cf) return cf
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const url = new URL(req.url)
  // Support both /email-track/pixel and /email-track/click paths
  const kind = url.pathname.endsWith('/click') ? 'click' : 'pixel'
  const mid = url.searchParams.get('mid')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const ip = getClientIp(req)
  const ua = req.headers.get('user-agent')

  // ---- Pixel (open) ----
  if (kind === 'pixel') {
    if (mid) {
      // Ignore Gmail image proxy prefetch (fires on delivery, not on real open)
      // Real Gmail opens still go through GoogleImageProxy but we can't reliably
      // distinguish them; we accept and count — same behavior as Mailchimp.
      supabase.from('email_events').insert({
        message_id: mid,
        event_type: 'open',
        ip_address: ip,
        user_agent: ua,
      }).then(({ error }) => {
        if (error) console.error('open insert error', error)
      })
    }
    return pixelResponse()
  }

  // ---- Click ----
  const target = url.searchParams.get('u')
  if (!target) {
    return new Response('Missing url', { status: 400 })
  }
  let decoded: string
  try {
    decoded = decodeURIComponent(target)
  } catch {
    return new Response('Bad url', { status: 400 })
  }
  // Only allow http(s) redirects — prevent open-redirect abuse to javascript: etc.
  if (!/^https?:\/\//i.test(decoded)) {
    return new Response('Invalid url', { status: 400 })
  }

  if (mid) {
    supabase.from('email_events').insert({
      message_id: mid,
      event_type: 'click',
      url: decoded,
      ip_address: ip,
      user_agent: ua,
    }).then(({ error }) => {
      if (error) console.error('click insert error', error)
    })
  }

  return new Response(null, {
    status: 302,
    headers: { Location: decoded, 'Cache-Control': 'no-store' },
  })
})
