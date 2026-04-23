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

    // Optional body: { workType: 'solaire' | 'isolation' | 'chauffage' | 'renovation' | 'mix' | 'none' }
    let workType: string | undefined
    if (req.method === 'POST') {
      try {
        const body = await req.json()
        if (body && typeof body.workType === 'string') {
          workType = body.workType
        }
      } catch {
        /* ignore */
      }
    }

    // Per workType deterministic overrides for preview content (formLabel + requestSummary)
    const WORK_TYPE_PRESETS: Record<
      string,
      { formLabel: string; requestSummary: string }
    > = {
      solaire: {
        formLabel: 'votre demande de devis solaire',
        requestSummary:
          'Installation panneaux photovoltaïques • Maison individuelle • 75001 Paris',
      },
      isolation: {
        formLabel: 'votre demande d’isolation',
        requestSummary:
          'Isolation des combles + ITE • Maison 1985 • 33000 Bordeaux',
      },
      chauffage: {
        formLabel: 'votre demande de chauffage',
        requestSummary:
          'Pompe à chaleur air/eau • Remplacement chaudière fioul • 69000 Lyon',
      },
      renovation: {
        formLabel: 'votre demande de rénovation globale',
        requestSummary:
          'Rénovation énergétique d’ampleur • Maison 120 m² • 31000 Toulouse',
      },
      mix: {
        formLabel: 'votre demande de conseil énergétique',
        requestSummary:
          'Plusieurs projets envisagés (je ne sais pas encore) • Maison principale • 44000 Nantes',
      },
      none: {
        formLabel: 'votre demande',
        requestSummary: 'Demande d’information générale • Rappel téléphonique souhaité',
      },
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
      const basePreview = entry.previewData || {}
      const preset = workType ? WORK_TYPE_PRESETS[workType] : undefined
      const previewData = preset
        ? {
            ...basePreview,
            formLabel: preset.formLabel,
            requestSummary: preset.requestSummary,
            workType,
          }
        : basePreview

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
