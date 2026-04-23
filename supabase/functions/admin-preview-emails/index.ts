/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Admin-only preview of all transactional templates.
// Auth: requires a Supabase JWT belonging to a super_admin user.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the calling user
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

    // Check super_admin role using service role
    const adminClient = createClient(supabaseUrl, serviceKey)
    const { data: roles } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userRes.user.id)

    const isAdmin = (roles || []).some(
      (r: { role: string }) => r.role === 'super_admin' || r.role === 'admin'
    )
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const templateNames = Object.keys(TEMPLATES)
    const results: Array<{
      templateName: string
      displayName: string
      subject: string
      html: string
      previewData: Record<string, unknown> | null
      status: 'ready' | 'render_failed'
      errorMessage?: string
    }> = []

    for (const name of templateNames) {
      const entry = TEMPLATES[name]
      const displayName = entry.displayName || name
      const previewData = entry.previewData || {}

      try {
        const html = await renderAsync(
          React.createElement(entry.component, previewData)
        )
        const resolvedSubject =
          typeof entry.subject === 'function'
            ? entry.subject(previewData)
            : entry.subject
        results.push({
          templateName: name,
          displayName,
          subject: resolvedSubject,
          html,
          previewData,
          status: 'ready',
        })
      } catch (err) {
        results.push({
          templateName: name,
          displayName,
          subject: '',
          html: '',
          previewData,
          status: 'render_failed',
          errorMessage: err instanceof Error ? err.message : String(err),
        })
      }
    }

    return new Response(JSON.stringify({ templates: results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('admin-preview-emails error', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
