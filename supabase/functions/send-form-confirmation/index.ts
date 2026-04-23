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

  const { formIdentifier, submissionId, recipient, requestSummary, formLabel } = body
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
  let userExists = false
  try {
    const { data: existing } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      // listUsers does not filter server-side; fall back to manual check below
    })
    // Workaround: getUserByEmail
    // @ts-ignore — admin.getUserByEmail exists in supabase-js v2
    const { data: byEmail } = await admin.auth.admin.getUserByEmail?.(recipient.email) ?? { data: null }
    if (byEmail?.user) userExists = true
  } catch {
    // best effort — fall through
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

  if (userExists) {
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
