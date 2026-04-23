/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Head,
  Heading,
  Html,
  Img,
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
  logoImg,
  headerBrand,
  headerTagline,
  accentBar,
  footerBar,
  contentSection,
  h1,
  text,
  strongAccent,
  recapBox,
  recapTitle,
  recapItem,
  hrSection,
  hr,
  signature,
  signatureText,
  footerSection,
  footerText,
  footerLink,
} from './_email-design.ts'
import { WorkGallery } from './_work-gallery.tsx'

interface Props {
  firstName?: string
  phone?: string
  email?: string
  formLabel?: string
  requestSummary?: string
}

const LeadConfirmationSimpleEmail = ({
  firstName,
  phone,
  email,
  formLabel = 'votre demande',
  requestSummary,
}: Props) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre demande a bien été reçue par {BRAND.siteName}</Preview>
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
                      <Img
                        src={BRAND.logoUrl}
                        alt={BRAND.siteName}
                        width={140}
                        height={52}
                        style={logoImg}
                      />
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
                        {firstName ? `Merci ${firstName} !` : 'Merci pour votre demande !'}
                      </Heading>

                      <Text style={text}>
                        Nous avons bien reçu <strong style={strongAccent}>{formLabel.toLowerCase()}</strong>.
                        Un de nos conseillers vous recontactera sous{' '}
                        <strong>24 à 48 heures ouvrées</strong> pour étudier
                        votre projet et vous proposer la solution la plus adaptée.
                      </Text>

                      {(requestSummary || email || phone) && (
                        <Section style={recapBox}>
                          <Text style={recapTitle}>Récapitulatif de votre demande</Text>
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

                      <Text style={text}>
                        En attendant notre appel, n'hésitez pas à préparer les
                        informations utiles à l'étude (factures d'énergie, surface
                        habitable, type de chauffage actuel, etc.).
                      </Text>
                    </td>
                  </tr>

                  {/* GALERIE selon type de travaux */}
                  <WorkGallery hint={`${formLabel} ${requestSummary ?? ''}`} />

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
  component: LeadConfirmationSimpleEmail,
  subject: ({ formLabel }: Props = {}) =>
    `Votre demande ${formLabel ? `pour ${formLabel.toLowerCase()} ` : ''}a bien été reçue | ${BRAND.siteName}`,
  displayName: 'Confirmation lead (sans inscription)',
  previewData: {
    firstName: 'Jean',
    phone: '06 12 34 56 78',
    email: 'jean.dupont@example.com',
    formLabel: 'votre demande de rappel',
    requestSummary: 'Demande de rappel téléphonique',
  },
} satisfies TemplateEntry
