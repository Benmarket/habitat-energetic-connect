/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import {
  BRAND,
  main,
  wrapper,
  card,
  header,
  headerBrand,
  headerTagline,
  accentBar,
  footerBar,
  contentSection,
  h1,
  h2,
  text,
  strongAccent,
  recapBox,
  recapTitle,
  recapItem,
  ctaSection,
  buttonSecondary,
  hrSection,
  hr,
  signature,
  signatureText,
  footerSection,
  footerText,
  footerLink,
} from './_email-design.ts'

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
  loginUrl = `${BRAND.siteUrl}/auth`,
}: Props) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>
      Votre nouvelle demande a bien été reçue — retrouvez-la dans votre espace
    </Preview>
    <Body style={main}>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={wrapper}>
        <tbody>
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellPadding={0} cellSpacing={0} border={0} style={card}>
                <tbody>
                  {/* HEADER */}
                  <tr>
                    <td style={header}>
                      <Heading as="h1" style={headerBrand}>{BRAND.siteName}</Heading>
                      <Text style={headerTagline}>{BRAND.tagline}</Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={accentBar}>&nbsp;</td>
                  </tr>

                  {/* CONTENU */}
                  <tr>
                    <td style={contentSection}>
                      <Heading as="h2" style={h1}>
                        {firstName ? `Bon retour ${firstName} !` : 'Merci pour votre nouvelle demande !'}
                      </Heading>

                      <Text style={text}>
                        Nous avons bien reçu <strong style={strongAccent}>{formLabel.toLowerCase()}</strong>.
                        Un de nos conseillers vous recontactera sous{' '}
                        <strong>24 à 48 heures ouvrées</strong>.
                      </Text>

                      <Text style={text}>
                        Bonne nouvelle : <strong>vous avez déjà un compte chez nous</strong>.
                        Vous retrouverez cette nouvelle demande directement dans votre
                        espace personnel, aux côtés de votre historique.
                      </Text>

                      {(requestSummary || email || phone) && (
                        <Section style={recapBox}>
                          <Text style={recapTitle}>📋 Récapitulatif de votre demande</Text>
                          {requestSummary && (
                            <Text style={recapItem}>
                              <strong>Projet :</strong> {requestSummary}
                            </Text>
                          )}
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
                    </td>
                  </tr>

                  {/* CTA */}
                  <tr>
                    <td style={{ padding: '0 36px' }}>
                      <Section style={ctaSection}>
                        <Heading as="h3" style={h2}>
                          Accédez à votre espace
                        </Heading>
                        <Text style={{ ...text, margin: '0 0 20px 0' }}>
                          Connectez-vous pour consulter cette demande, suivre son
                          avancement et retrouver tout votre historique.
                        </Text>
                        <Button href={loginUrl} style={buttonSecondary}>
                          Me connecter à mon espace →
                        </Button>
                      </Section>
                    </td>
                  </tr>

                  <tr>
                    <td style={hrSection}>
                      <div style={hr}>&nbsp;</div>
                    </td>
                  </tr>

                  {/* SIGNATURE */}
                  <tr>
                    <td style={signature}>
                      <Text style={signatureText}>
                        À très vite,<br />
                        <strong style={strongAccent}>L'équipe {BRAND.siteName}</strong>
                      </Text>
                    </td>
                  </tr>

                  {/* FOOTER */}
                  <tr>
                    <td style={footerSection}>
                      <Text style={footerText}>
                        Cet email vous est envoyé suite à votre demande sur{' '}
                        <Link href={BRAND.siteUrl} style={footerLink}>
                          prime-energies.fr
                        </Link>
                        <br />
                        © {new Date().getFullYear()} {BRAND.siteName} — Tous droits réservés
                      </Text>
                    </td>
                  </tr>

                  <tr>
                    <td style={footerBar}>&nbsp;</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </Body>
  </Html>
)

export const template = {
  component: LeadConfirmationExistingEmail,
  subject: ({ formLabel }: Props = {}) =>
    `Votre demande ${formLabel ? `pour ${formLabel.toLowerCase()} ` : ''}a bien été reçue | ${BRAND.siteName}`,
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
