/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Prime Energies'
const SITE_URL = 'https://prime-energies.fr'

interface Props {
  firstName?: string
  phone?: string
  email?: string
  formLabel?: string
  requestSummary?: string
  loginUrl?: string
}

const LeadConfirmationExistingEmail = ({
  firstName,
  phone,
  email,
  formLabel = 'votre demande',
  requestSummary,
  loginUrl = `${SITE_URL}/auth`,
}: Props) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre demande a bien été reçue par Prime Energies</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Heading style={brand}>{SITE_NAME}</Heading>
        </Section>

        <Heading style={h1}>
          {firstName ? `Bon retour ${firstName} !` : 'Merci pour votre nouvelle demande !'}
        </Heading>

        <Text style={text}>
          Nous avons bien reçu {formLabel.toLowerCase()}. Un de nos conseillers
          vous recontacte sous 24-48 heures ouvrées.
        </Text>

        {(requestSummary || email || phone) && (
          <Section style={recapBox}>
            <Text style={recapTitle}>📋 Récapitulatif de votre demande</Text>
            {requestSummary && <Text style={recapItem}>{requestSummary}</Text>}
            {email && (
              <Text style={recapItem}>
                <strong>Email :</strong> {email}
              </Text>
            )}
            {phone && (
              <Text style={recapItem}>
                <strong>Téléphone :</strong> {phone}
              </Text>
            )}
          </Section>
        )}

        <Hr style={hr} />

        <Section style={ctaSection}>
          <Heading style={h2}>Retrouvez votre demande dans votre espace</Heading>
          <Text style={text}>
            Connectez-vous pour consulter cette demande, retrouver votre historique
            et poursuivre votre parcours depuis votre espace personnel.
          </Text>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={loginUrl} style={button}>
              Me connecter à mon espace
            </Button>
          </Section>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          À très vite,<br />
          L'équipe {SITE_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: LeadConfirmationExistingEmail,
  subject: ({ formLabel }: Props = {}) =>
    `Votre demande ${formLabel ? `pour ${formLabel.toLowerCase()}` : ''} a bien été reçue | ${SITE_NAME}`.replace('  ', ' '),
  displayName: 'Confirmation lead (utilisateur existant)',
  previewData: {
    firstName: 'Jean',
    phone: '06 12 34 56 78',
    email: 'jean.dupont@example.com',
    formLabel: 'votre demande de devis solaire',
    requestSummary: 'Installation panneaux solaires • Maison individuelle • 75001 Paris',
    loginUrl: 'https://prime-energies.fr/auth',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}
const container = { padding: '24px', maxWidth: '600px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, paddingBottom: '8px' }
const brand = {
  fontSize: '20px',
  fontWeight: 700,
  color: '#0a6b3f',
  letterSpacing: '0.5px',
  margin: '0 0 16px',
}
const h1 = { fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }
const h2 = { fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const recapBox = {
  backgroundColor: '#f1f5f9',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '16px 0',
}
const recapTitle = { fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }
const recapItem = { fontSize: '14px', color: '#334155', margin: '4px 0' }
const ctaSection = {
  backgroundColor: '#eff6ff',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '20px 0',
}
const button = {
  backgroundColor: '#1e40af',
  color: '#ffffff',
  padding: '12px 28px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
}
const hr = { borderColor: '#e2e8f0', margin: '24px 0' }
const footer = { fontSize: '14px', color: '#64748b', margin: '8px 0 0' }
