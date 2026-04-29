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
  const includeSignup = form?.include_signup_link ?? true

  if (!sendEmail) {
    return new Response(JSON.stringify({ skipped: true, reason: 'disabled_for_form' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

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

  if (isGuideDownload) {
    // Template dédié téléchargement guide
    templateName = 'guide-download-confirmation'
    templateData.guideTitle = guideTitle || 'votre guide'
    templateData.guideUrl = guideSlug ? `${origin}/guides/${guideSlug}` : `${origin}/guides`

    // Si le user n'a pas de compte ET que le form active include_signup_link,
    // on ajoute un lien d'activation optionnel (le template l'affiche en bonus).
    if (!userExists && includeSignup) {
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
    templateName = 'lead-confirmation-existing'
    templateData.loginUrl = `${origin}/auth`
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
