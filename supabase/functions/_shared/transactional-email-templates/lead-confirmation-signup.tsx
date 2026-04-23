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
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Prime Energies'
const SITE_URL = 'https://prime-energies.fr'

interface Props {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  formLabel?: string
  requestSummary?: string
  activationUrl?: string
}

const LeadConfirmationSignupEmail = ({
  firstName,
  phone,
  email,
  formLabel = 'votre demande',
  requestSummary,
  activationUrl = SITE_URL,
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
          {firstName ? `Merci ${firstName} !` : 'Merci pour votre demande !'}
        </Heading>

        <Text style={text}>
          Nous avons bien reçu {formLabel.toLowerCase()}. Un de nos conseillers
          vous recontacte sous 24-48 heures ouvrées pour étudier votre projet.
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
          <Heading style={h2}>🚀 Allez plus loin avec votre espace membre</Heading>
          <Text style={text}>
            Créez votre compte en un clic pour suivre votre demande, accéder
            aux aides personnalisées, recevoir nos guides exclusifs et bénéficier
            de simulateurs avancés.
          </Text>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Button href={activationUrl} style={button}>
              Créer mon espace membre
            </Button>
          </Section>
          <Text style={smallText}>
            Ce lien est valable 7 jours et personnel. Si vous n'êtes pas à
            l'origine de cette demande, ignorez ce message.
          </Text>
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
  component: LeadConfirmationSignupEmail,
  subject: ({ formLabel }: Props = {}) =>
    `Votre demande ${formLabel ? `pour ${formLabel.toLowerCase()}` : ''} a bien été reçue | ${SITE_NAME}`.replace('  ', ' '),
  displayName: 'Confirmation lead + lien inscription',
  previewData: {
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '06 12 34 56 78',
    email: 'jean.dupont@example.com',
    formLabel: 'votre demande de devis solaire',
    requestSummary: 'Installation panneaux solaires • Maison individuelle • 75001 Paris',
    activationUrl: 'https://prime-energies.fr/inscription/activer?token=preview',
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
const smallText = { fontSize: '12px', color: '#64748b', lineHeight: '1.5', textAlign: 'center' as const, margin: '12px 0 0' }
const recapBox = {
  backgroundColor: '#f1f5f9',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '16px 0',
}
const recapTitle = { fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }
const recapItem = { fontSize: '14px', color: '#334155', margin: '4px 0' }
const ctaSection = {
  backgroundColor: '#ecfdf5',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '20px 0',
}
const button = {
  backgroundColor: '#0a6b3f',
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
