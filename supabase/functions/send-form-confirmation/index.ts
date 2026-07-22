// Edge function: send-form-confirmation
// Public (verify_jwt = false) — orchestrates the post-form-submission email flow.
// Looks up the form config, decides which template to use (signup link or
// existing-user variant), generates a magic activation token if needed,
// then invokes send-transactional-email.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  formIdentifier: string
  submissionId?: string
  recipient: {
    email: string
    firstName?: string
    lastName?: string
    phone?: string
  }
  requestSummary?: string
  formLabel?: string
  // optional override (defaults to https://prime-energies.fr)
  siteOrigin?: string
  // Contexte spécifique téléchargement guide
  guideTitle?: string
  guideSlug?: string
}

const DEFAULT_ORIGIN = 'https://prime-energies.fr'

// Cryptographically random hex token (32 bytes)
function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
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

  // Rate-limit par IP : 10 requêtes / heure sur cet endpoint.
  // Bloque le spam de mails de confirmation & la génération massive de tokens
  // sans impacter les visiteurs normaux (qui n'envoient qu'un seul formulaire).
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('cf-connecting-ip')
    || ''
  if (ip) {
    const { data: allowed, error: rateErr } = await admin.rpc('check_edge_rate', {
      p_identifier: ip,
      p_endpoint: 'send-form-confirmation',
      p_max_per_hour: 10,
    })
    if (rateErr) {
      console.warn('[send-form-confirmation] rate check error (fail-open):', rateErr)
    } else if (allowed === false) {
      console.warn(`[send-form-confirmation] rate limit hit for ip=${ip}`)
      return new Response(
        JSON.stringify({
          error: 'rate_limited',
          message: 'Trop de demandes récentes. Merci de réessayer dans une heure.',
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    // Enregistre l'appel (fire-and-forget)
    admin.rpc('record_edge_call', {
      p_identifier: ip,
      p_endpoint: 'send-form-confirmation',
    }).then(({ error }) => {
      if (error) console.warn('[send-form-confirmation] record_edge_call error:', error)
    })
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { formIdentifier, submissionId, recipient, requestSummary, formLabel, guideTitle, guideSlug } = body
  const origin = body.siteOrigin || DEFAULT_ORIGIN

  if (!formIdentifier || !recipient?.email) {
    return new Response(JSON.stringify({ error: 'Missing formIdentifier or recipient.email' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // 1) Read form config — only act if confirmation email is enabled
  const { data: form, error: formErr } = await admin
    .from('form_configurations')
    .select('id, name, send_confirmation_email, include_signup_link')
    .eq('form_identifier', formIdentifier)
    .maybeSingle()

  if (formErr) {
    console.error('Form lookup failed:', formErr)
    return new Response(JSON.stringify({ error: 'Form lookup failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // If form is not registered, default to enabling confirmation but no signup link
  const sendEmail = form?.send_confirmation_email ?? true
  let includeSignup = form?.include_signup_link ?? true

  if (!sendEmail) {
    return new Response(JSON.stringify({ skipped: true, reason: 'disabled_for_form' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // 1.b) Global modular overrides (set in /admin/confirmation)
  // Allows admin to temporarily hide member-space links across all forms.
  const { data: memberLinkSetting } = await admin
    .from('site_settings')
    .select('value')
    .eq('key', 'member_link_settings')
    .maybeSingle()
  const memberLinks = (memberLinkSetting?.value as
    | { signup?: boolean; existing?: boolean; guide?: boolean; newsletter?: boolean }
    | null) ?? {}
  const allowSignupLink = memberLinks.signup !== false // default true
  const allowExistingLink = memberLinks.existing !== false // default true
  const allowGuideLink = memberLinks.guide !== false // default true
  const allowNewsletterCta = memberLinks.newsletter !== false // default true

  if (!allowSignupLink) includeSignup = false

  // 2) Detect if a user account already exists for this email
  // We query auth.users via a SECURITY DEFINER RPC because admin.getUserByEmail
  // does NOT exist in supabase-js v2 (only listUsers with paging).
  let userExists = false
  try {
    const normalizedEmail = recipient.email.trim().toLowerCase()
    const { data: existsData, error: existsErr } = await admin.rpc('email_has_account', {
      _email: normalizedEmail,
    })
    if (existsErr) {
      console.warn('[send-form-confirmation] email_has_account RPC error:', existsErr)
    } else {
      userExists = existsData === true
    }
    console.log(`[send-form-confirmation] email=${normalizedEmail} userExists=${userExists}`)
  } catch (e) {
    console.warn('[send-form-confirmation] user existence check failed:', e)
  }

  // 3) Choose template
  let templateName: string
  const templateData: Record<string, any> = {
    firstName: recipient.firstName,
    lastName: recipient.lastName,
    phone: recipient.phone,
    email: recipient.email,
    formLabel: formLabel || form?.name || 'votre demande',
    requestSummary,
  }

  const isGuideDownload = formIdentifier === 'guide-download'
  const isPartnerApplication = formIdentifier === 'partner-application'

  // Partenaires : template dédié B2B, jamais de magic link espace membre
  if (isPartnerApplication) {
    // Récupère les données spécifiques depuis form_submissions si dispo
    let partnerData: Record<string, any> = {}
    if (submissionId) {
      const { data: sub } = await admin
        .from('form_submissions')
        .select('data')
        .eq('id', submissionId)
        .maybeSingle()
      if (sub?.data) partnerData = sub.data as Record<string, any>
    }

    const partnerTemplateData = {
      firstName: recipient.firstName || partnerData.prenom,
      lastName: recipient.lastName || partnerData.nom,
      email: recipient.email,
      phone: recipient.phone || partnerData.telephone,
      companyName: partnerData.raison_sociale,
      zone: partnerData.zone_intervention,
      workTypes: Array.isArray(partnerData.types_travaux) ? partnerData.types_travaux : undefined,
      formLabel: formLabel || form?.name || 'votre candidature partenaire',
      requestSummary,
    }

    const idempotencyKey = `partner-confirm-${submissionId ?? recipient.email}`
    const { data: sendResult, error: sendErr } = await admin.functions.invoke(
      'send-transactional-email',
      {
        body: {
          templateName: 'partner-application-confirmation',
          recipientEmail: recipient.email,
          idempotencyKey,
          templateData: partnerTemplateData,
        },
      },
    )
    if (sendErr) {
      console.error('Partner send invoke failed:', sendErr)
      return new Response(JSON.stringify({ error: 'Send failed', detail: String(sendErr) }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    return new Response(
      JSON.stringify({ success: true, templateName: 'partner-application-confirmation', sent: sendResult }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }


  if (isGuideDownload) {
    // Template dédié téléchargement guide
    templateName = 'guide-download-confirmation'
    templateData.guideTitle = guideTitle || 'votre guide'
    templateData.guideUrl = guideSlug ? `${origin}/guides/${guideSlug}` : `${origin}/guides`

    // Si le user n'a pas de compte ET que le form active include_signup_link,
    // on ajoute un lien d'activation optionnel (le template l'affiche en bonus).
    if (!userExists && includeSignup && allowGuideLink) {
      const rawToken = generateToken()
      const tokenHash = await sha256Hex(rawToken)
      const { error: tokenErr } = await admin.from('signup_activation_tokens').insert({
        token_hash: tokenHash,
        email: recipient.email,
        first_name: recipient.firstName ?? null,
        last_name: recipient.lastName ?? null,
        phone: recipient.phone ?? null,
        source_form_identifier: formIdentifier,
        source_submission_id: submissionId ?? null,
      })
      if (!tokenErr) {
        templateData.activationUrl = `${origin}/inscription/activer?token=${rawToken}`
      } else {
        console.warn('[send-form-confirmation] guide token insert failed:', tokenErr)
      }
    }
  } else if (userExists) {
    if (allowExistingLink) {
      templateName = 'lead-confirmation-existing'
      templateData.loginUrl = `${origin}/auth`
    } else {
      templateName = 'lead-confirmation-simple'
    }
  } else if (includeSignup) {
    // Generate magic activation token
    const rawToken = generateToken()
    const tokenHash = await sha256Hex(rawToken)

    const { error: tokenErr } = await admin.from('signup_activation_tokens').insert({
      token_hash: tokenHash,
      email: recipient.email,
      first_name: recipient.firstName ?? null,
      last_name: recipient.lastName ?? null,
      phone: recipient.phone ?? null,
      source_form_identifier: formIdentifier,
      source_submission_id: submissionId ?? null,
    })
    if (tokenErr) {
      console.error('Token insert failed:', tokenErr)
      return new Response(JSON.stringify({ error: 'Token creation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    templateName = 'lead-confirmation-signup'
    templateData.activationUrl = `${origin}/inscription/activer?token=${rawToken}`
  } else {
    templateName = 'lead-confirmation-simple'
  }

  // 4) Invoke send-transactional-email
  const idempotencyKey = `form-confirm-${submissionId ?? recipient.email}-${formIdentifier}-${templateName}`

  const { data: sendResult, error: sendErr } = await admin.functions.invoke(
    'send-transactional-email',
    {
      body: {
        templateName,
        recipientEmail: recipient.email,
        idempotencyKey,
        templateData,
      },
    },
  )

  if (sendErr) {
    console.error('Send invoke failed:', sendErr)
    return new Response(JSON.stringify({ error: 'Send failed', detail: String(sendErr) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(
    JSON.stringify({ success: true, templateName, sent: sendResult }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
