/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
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
  h2,
  text,
  strongAccent,
  smallText,
  recapBox,
  recapTitle,
  recapItem,
  ctaSection,
  button,
  hrSection,
  hr,
  signature,
  signatureText,
  footerSection,
  footerText,
  footerLink,
} from './_email-design.ts'
import { WorkGallery, type CustomGalleryImage } from './_work-gallery.tsx'
import type { WorkType } from './_email-design.ts'

interface Props {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  formLabel?: string
  requestSummary?: string
  activationUrl?: string
  workType?: WorkType
  galleryImages?: CustomGalleryImage[]
}

const LeadConfirmationSignupEmail = ({
  firstName,
  phone,
  email,
  formLabel = 'votre demande',
  requestSummary,
  activationUrl = BRAND.siteUrl,
  workType,
  galleryImages,
}: Props) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>
      Votre demande a bien été reçue — activez votre espace {BRAND.siteName}
    </Preview>
    <Body style={main}>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={wrapper}>
        <tbody>
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellPadding={0} cellSpacing={0} border={0} style={card}>
                <tbody>
                  {/* HEADER sombre + logo */}
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
                        <strong>24 à 48 heures ouvrées</strong> pour étudier votre projet
                        et vous proposer la solution la plus adaptée.
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
                    </td>
                  </tr>

                  {/* GALERIE selon type de travaux */}
                  <WorkGallery
                    workType={workType}
                    hint={`${formLabel} ${requestSummary ?? ''}`}
                  />

                  {/* CTA */}
                  <tr>
                    <td style={{ padding: '0 40px' }}>
                      <Section style={ctaSection}>
                        <Heading as="h3" style={h2}>
                          Activez votre espace personnel
                        </Heading>
                        <Text style={{ ...text, margin: '0 0 20px 0' }}>
                          Définissez votre mot de passe pour suivre votre demande,
                          centraliser vos documents et accéder à toutes nos aides en
                          un clic.
                        </Text>
                        <Button href={activationUrl} style={button}>
                          Créer mon espace membre →
                        </Button>
                        <Text style={smallText}>
                          Lien personnel valable 7 jours. Si vous n'êtes pas à
                          l'origine de cette demande, ignorez simplement cet email.
                        </Text>
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
  component: LeadConfirmationSignupEmail,
  subject: ({ formLabel }: Props = {}) =>
    `Votre demande ${formLabel ? `pour ${formLabel.toLowerCase()} ` : ''}a bien été reçue | ${BRAND.siteName}`,
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
