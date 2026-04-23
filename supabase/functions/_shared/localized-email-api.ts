import { EmailAPIError } from 'npm:@lovable.dev/email-js'
import type {
  EmailSendRequest,
  EmailSendResponse,
  SendEmailOptions,
} from 'npm:@lovable.dev/email-js'

const DEFAULT_AUTH_HEADER = 'Authorization'
const DEFAULT_API_BASE_URL = 'https://api.lovable.dev'
const DEFAULT_SEND_PATH = '/v1/messaging/email/send'

export const VERIFIED_TRANSACTIONAL_EMAIL_LANGUAGE = 'fr' as const
export const VERIFIED_TRANSACTIONAL_EMAIL_LOCALE = 'fr' as const
export const VERIFIED_TRANSACTIONAL_EMAIL_ACCEPT_LANGUAGE =
  'fr-FR,fr;q=1.0,en;q=0.2' as const

export type VerifiedTransactionalEmailPayload = EmailSendRequest &
  Record<string, unknown> & {
    language: typeof VERIFIED_TRANSACTIONAL_EMAIL_LANGUAGE
    locale: typeof VERIFIED_TRANSACTIONAL_EMAIL_LOCALE
  }

function parseRetryAfter(header: string | null): number | null {
  if (!header) {
    return null
  }

  const parsed = Number(header)
  if (!Number.isNaN(parsed)) {
    return parsed
  }

  const date = new Date(header)
  if (!Number.isNaN(date.getTime())) {
    return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 1e3))
  }

  return null
}

function buildAuthHeaderValue(apiKey: string): string {
  return `Bearer ${apiKey}`
}

export function buildVerifiedTransactionalEmailPayload(
  payload: EmailSendRequest & Record<string, unknown>
): VerifiedTransactionalEmailPayload {
  return {
    ...payload,
    locale: VERIFIED_TRANSACTIONAL_EMAIL_LOCALE,
    language: VERIFIED_TRANSACTIONAL_EMAIL_LANGUAGE,
  }
}

export function buildVerifiedTransactionalEmailRequest(
  payload: EmailSendRequest & Record<string, unknown>,
  options: SendEmailOptions
) {
  const apiKey = options.apiKey
  if (!apiKey) {
    throw new Error('Missing Lovable API key')
  }

  const authHeader = options.authHeader ?? DEFAULT_AUTH_HEADER
  const sendUrl = options.sendUrl
  const apiBaseUrl = options.apiBaseUrl ?? DEFAULT_API_BASE_URL
  const url = sendUrl || `${apiBaseUrl.replace(/\/$/, '')}${DEFAULT_SEND_PATH}`
  const idempotencyKey =
    options.idempotencyKey ?? payload.idempotency_key ?? payload.run_id
  const verifiedPayload = buildVerifiedTransactionalEmailPayload(payload)

  const headers: Record<string, string> = {
    [authHeader]: buildAuthHeaderValue(apiKey),
    'Content-Type': 'application/json',
    'Accept-Language': VERIFIED_TRANSACTIONAL_EMAIL_ACCEPT_LANGUAGE,
    'Content-Language': VERIFIED_TRANSACTIONAL_EMAIL_LANGUAGE,
    'X-Lovable-Locale': VERIFIED_TRANSACTIONAL_EMAIL_LOCALE,
    'X-Lovable-Language': VERIFIED_TRANSACTIONAL_EMAIL_LANGUAGE,
  }

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  return {
    url,
    headers,
    payload: verifiedPayload,
  }
}

export async function sendVerifiedTransactionalEmail(
  payload: EmailSendRequest & Record<string, unknown>,
  options: SendEmailOptions,
  fetchImpl: typeof fetch = fetch
): Promise<EmailSendResponse> {
  const request = buildVerifiedTransactionalEmailRequest(payload, options)

  const response = await fetchImpl(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify(request.payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    const safeErrorText =
      errorText.length > 500 ? `${errorText.slice(0, 500)}...` : errorText

    throw new EmailAPIError(
      response.status,
      `Email API error: ${response.status} ${safeErrorText}`,
      parseRetryAfter(response.headers.get('Retry-After'))
    )
  }

  return (await response.json()) as EmailSendResponse
}