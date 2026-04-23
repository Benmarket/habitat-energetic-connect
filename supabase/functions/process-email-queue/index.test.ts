import {
  buildVerifiedTransactionalEmailRequest,
  VERIFIED_TRANSACTIONAL_EMAIL_ACCEPT_LANGUAGE,
  VERIFIED_TRANSACTIONAL_EMAIL_LANGUAGE,
  VERIFIED_TRANSACTIONAL_EMAIL_LOCALE,
} from '../_shared/localized-email-api.ts'

Deno.test('force la langue française dans le payload et les en-têtes d’envoi', () => {
  const request = buildVerifiedTransactionalEmailRequest(
    {
      to: 'client@example.com',
      from: 'Prime Energies <noreply@prime-energies.fr>',
      sender_domain: 'notify.prime-energies.fr',
      subject: 'Confirmation de votre demande',
      html: '<p>Bonjour</p>',
      text: 'Bonjour',
      purpose: 'transactional',
      label: 'lead-confirmation-existing',
      idempotency_key: 'lead-123',
      unsubscribe_token: 'token-123',
      message_id: 'message-123',
    },
    {
      apiKey: 'test-api-key',
      sendUrl: 'https://api.example.test/v1/messaging/email/send',
    }
  )

  if (request.payload.locale !== VERIFIED_TRANSACTIONAL_EMAIL_LOCALE) {
    throw new Error(`Locale attendue: ${VERIFIED_TRANSACTIONAL_EMAIL_LOCALE}, reçu: ${request.payload.locale}`)
  }

  if (request.payload.language !== VERIFIED_TRANSACTIONAL_EMAIL_LANGUAGE) {
    throw new Error(`Language attendu: ${VERIFIED_TRANSACTIONAL_EMAIL_LANGUAGE}, reçu: ${request.payload.language}`)
  }

  if (request.headers['Accept-Language'] !== VERIFIED_TRANSACTIONAL_EMAIL_ACCEPT_LANGUAGE) {
    throw new Error('Le header Accept-Language n’est pas forcé en français')
  }

  if (request.headers['Content-Language'] !== VERIFIED_TRANSACTIONAL_EMAIL_LANGUAGE) {
    throw new Error('Le header Content-Language n’est pas forcé en français')
  }

  if (request.headers['X-Lovable-Locale'] !== VERIFIED_TRANSACTIONAL_EMAIL_LOCALE) {
    throw new Error('Le header X-Lovable-Locale est absent ou incorrect')
  }

  if (request.headers['X-Lovable-Language'] !== VERIFIED_TRANSACTIONAL_EMAIL_LANGUAGE) {
    throw new Error('Le header X-Lovable-Language est absent ou incorrect')
  }
})