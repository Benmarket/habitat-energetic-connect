/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { WorkGallery } from './_work-gallery.tsx'
import { EmailBrandLogo } from './_email-brand-logo.tsx'

/**
 * Confirmation email — B2B partner application.
 * Header sombre cohérent avec les autres templates (logo Prime Énergies),
 * accents orange/ambre B2B, ton pro et mesuré : ni promesses commerciales,
 * ni ton "rentre-dedans". Aucun magic link espace membre.
 */

interface Props {
  firstName?: string
  lastName?: string
  companyName?: string
  email?: string
  phone?: string
  zone?: string
  workTypes?: string[]
  requestSummary?: string
  formLabel?: string
}

const SITE_NAME = 'Prime Énergies'
const SITE_URL = 'https://prime-energies.fr'

// ---- Styles inline ----
const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
}
const wrapper = { padding: '32px 12px' }
const card = {
  backgroundColor: '#ffffff',
  border: '1px solid #e6e8ee',
  borderRadius: '18px',
  overflow: 'hidden' as const,
  boxShadow: '0 4px 24px rgba(15, 23, 42, 0.06)',
}

// Header sombre + logo (aligné avec lead-confirmation-signup)
const header = {
  backgroundColor: '#0f172a',
  padding: '28px 32px 24px 32px',
  textAlign: 'center' as const,
}
const accentBar = {
  height: '4px',
  background:
    'linear-gradient(90deg, #f59e0b 0%, #f97316 50%, #ea580c 100%)',
  fontSize: 0,
  lineHeight: 0,
}

// Intro B2B
const introSection = { padding: '32px 40px 8px 40px' }
const eyebrow = {
  color: '#c2410c',
  fontSize: '12px',
  fontWeight: 800 as const,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  margin: '0 0 10px 0',
}
const h1 = {
  color: '#0f172a',
  fontSize: '26px',
  lineHeight: 1.25,
  fontWeight: 800 as const,
  margin: '0 0 14px 0',
  letterSpacing: '-0.3px',
}
const paragraph = {
  color: '#334155',
  fontSize: '15px',
  lineHeight: 1.7,
  margin: '0 0 14px 0',
}
const strongAccent = { color: '#c2410c', fontWeight: 700 as const }

// Étapes — rail vertical orange, cartes claires
const stepsSection = { padding: '8px 40px 12px 40px' }
const stepRow = {
  padding: '14px 16px',
  border: '1px solid #f1f5f9',
  borderLeft: '3px solid #f97316',
  borderRadius: '10px',
  background: '#ffffff',
  marginBottom: '10px',
}
const stepEyebrow = {
  color: '#9a3412',
  fontSize: '11px',
  fontWeight: 800 as const,
  margin: '0 0 4px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
}
const stepTitle = {
  color: '#0f172a',
  fontSize: '15px',
  fontWeight: 700 as const,
  margin: '0 0 4px 0',
}
const stepDesc = {
  color: '#475569',
  fontSize: '14px',
  margin: 0,
  lineHeight: 1.55,
}

// Récapitulatif
const recapBox = {
  background: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '12px',
  padding: '18px 20px',
  margin: '12px 40px 20px 40px',
}
const recapTitle = {
  color: '#78350f',
  fontSize: '12px',
  fontWeight: 800 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  margin: '0 0 10px 0',
}
const recapItem = {
  color: '#3f3f46',
  fontSize: '14px',
  margin: '0 0 6px 0',
  lineHeight: 1.55,
}

// Note ton mesuré
const noteBox = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '14px 16px',
  margin: '4px 40px 20px 40px',
}
const noteText = {
  color: '#475569',
  fontSize: '13px',
  lineHeight: 1.6,
  margin: 0,
  fontStyle: 'italic' as const,
}

// Signature
const signature = { padding: '4px 40px 28px 40px' }
const signatureText = {
  color: '#334155',
  fontSize: '14px',
  lineHeight: 1.65,
  margin: 0,
}

// Footer
const footerSection = {
  background: '#f8fafc',
  padding: '20px 40px',
  borderTop: '1px solid #e2e8f0',
}
const footerText = {
  color: '#64748b',
  fontSize: '12px',
  lineHeight: 1.6,
  margin: 0,
  textAlign: 'center' as const,
}
const footerLink = { color: '#c2410c', textDecoration: 'underline' }

const PartnerApplicationEmail = ({
  firstName,
  companyName,
  email,
  phone,
  zone,
  workTypes,
  requestSummary,
}: Props) => {
  const worksLine =
    workTypes && workTypes.length > 0 ? workTypes.join(' • ') : undefined

  return (
    <Html lang="fr" dir="ltr">
      <Head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta charSet="utf-8" />
      </Head>
      <Preview>
        Nous avons bien reçu votre candidature — {SITE_NAME}
      </Preview>
      <Body style={main}>
        <table
          role="presentation"
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          border={0}
          style={wrapper}
        >
          <tbody>
            <tr>
              <td align="center">
                <table
                  role="presentation"
                  width="640"
                  cellPadding={0}
                  cellSpacing={0}
                  border={0}
                  style={card}
                >
                  <tbody>
                    {/* HEADER sombre + logo */}
                    <tr>
                      <td style={header}>
                        <EmailBrandLogo />
                      </td>
                    </tr>
                    <tr>
                      <td style={accentBar}>&nbsp;</td>
                    </tr>

                    {/* INTRO */}
                    <tr>
                      <td style={introSection}>
                        <Text style={eyebrow}>Espace professionnels</Text>
                        <Heading as="h1" style={h1}>
                          {firstName
                            ? `Merci ${firstName}, votre candidature est bien reçue.`
                            : 'Votre candidature est bien reçue.'}
                        </Heading>
                        <Text style={paragraph}>
                          Bonjour{firstName ? ` ${firstName}` : ''},
                        </Text>
                        <Text style={paragraph}>
                          Nous avons enregistré la candidature de{' '}
                          <strong style={strongAccent}>
                            {companyName || 'votre entreprise'}
                          </strong>{' '}
                          pour rejoindre le réseau {SITE_NAME}.
                        </Text>
                        <Text style={paragraph}>
                          Toutes les candidatures sont étudiées avec la même
                          attention. Notre équipe vérifie la conformité de
                          chaque dossier au cahier des charges des primes
                          énergies&nbsp;: certification RGE, ancienneté SIRET,
                          assurance décennale et références.
                        </Text>
                      </td>
                    </tr>

                    {/* ÉTAPES */}
                    <tr>
                      <td style={stepsSection}>
                        <div style={stepRow}>
                          <Text style={stepEyebrow}>Étape 1</Text>
                          <Text style={stepTitle}>Étude de votre dossier</Text>
                          <Text style={stepDesc}>
                            Vérification approfondie de vos qualifications sous{' '}
                            <strong>48 à 72&nbsp;heures ouvrées</strong>.
                          </Text>
                        </div>
                        <div style={stepRow}>
                          <Text style={stepEyebrow}>Étape 2</Text>
                          <Text style={stepTitle}>Retour de notre équipe</Text>
                          <Text style={stepDesc}>
                            Vous recevrez une réponse motivée, que votre
                            candidature soit retenue ou non. En cas d'avis
                            favorable, un échange est planifié pour cadrer la
                            collaboration.
                          </Text>
                        </div>
                        <div style={stepRow}>
                          <Text style={stepEyebrow}>Étape 3</Text>
                          <Text style={stepTitle}>Intégration au réseau</Text>
                          <Text style={stepDesc}>
                            Si le partenariat est confirmé, nous formalisons
                            ensemble les modalités et procédons à l'activation
                            de votre espace.
                          </Text>
                        </div>
                      </td>
                    </tr>

                    {/* RÉCAPITULATIF */}
                    {(companyName ||
                      email ||
                      phone ||
                      zone ||
                      worksLine ||
                      requestSummary) && (
                      <tr>
                        <td>
                          <Section style={recapBox}>
                            <Text style={recapTitle}>
                              Récapitulatif de votre candidature
                            </Text>
                            {companyName && (
                              <Text style={recapItem}>
                                <strong>Entreprise&nbsp;:</strong> {companyName}
                              </Text>
                            )}
                            {email && (
                              <Text style={recapItem}>
                                <strong>Email&nbsp;:</strong> {email}
                              </Text>
                            )}
                            {phone && (
                              <Text style={recapItem}>
                                <strong>Téléphone&nbsp;:</strong> {phone}
                              </Text>
                            )}
                            {zone && (
                              <Text style={recapItem}>
                                <strong>Zone d'intervention&nbsp;:</strong>{' '}
                                {zone}
                              </Text>
                            )}
                            {worksLine && (
                              <Text style={recapItem}>
                                <strong>Activités&nbsp;:</strong> {worksLine}
                              </Text>
                            )}
                            {!worksLine && requestSummary && (
                              <Text style={recapItem}>
                                <strong>Résumé&nbsp;:</strong> {requestSummary}
                              </Text>
                            )}
                          </Section>
                        </td>
                      </tr>
                    )}

                    {/* NOTE DE TON MESURÉ */}
                    <tr>
                      <td>
                        <div style={noteBox}>
                          <Text style={noteText}>
                            Nous construisons un réseau restreint de
                            professionnels de confiance. Chaque candidature
                            reçoit un retour&nbsp;: nous privilégions la qualité
                            et la transparence à la quantité.
                          </Text>
                        </div>
                      </td>
                    </tr>

                    {/* GALERIE — même bibliothèque que les autres templates */}
                    <WorkGallery
                      workType="mix"
                      title="Quelques chantiers de notre réseau"
                      hint="rénovation énergétique partenaires"
                    />

                    {/* SIGNATURE */}
                    <tr>
                      <td style={signature}>
                        <Text style={signatureText}>
                          À très vite,
                          <br />
                          <strong style={strongAccent}>
                            L'équipe Partenariats — {SITE_NAME}
                          </strong>
                        </Text>
                      </td>
                    </tr>

                    {/* FOOTER */}
                    <tr>
                      <td style={footerSection}>
                        <Text style={footerText}>
                          Email envoyé suite à votre candidature sur{' '}
                          <Link
                            href={`${SITE_URL}/devenir-partenaire`}
                            style={footerLink}
                          >
                            prime-energies.fr/devenir-partenaire
                          </Link>
                          <br />© {new Date().getFullYear()} {SITE_NAME} —
                          Réseau d'artisans et installateurs certifiés RGE
                        </Text>
                      </td>
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
}

export const template = {
  component: PartnerApplicationEmail,
  subject: ({ companyName }: Props = {}) =>
    `Candidature partenaire${companyName ? ` de ${companyName}` : ''} bien reçue | ${SITE_NAME}`,
  displayName: 'Candidature partenaire (B2B)',
  previewData: {
    firstName: 'Marc',
    lastName: 'Durand',
    companyName: 'SARL Durand Rénovation',
    email: 'marc.durand@durand-renovation.fr',
    phone: '04 12 34 56 78',
    zone: 'Bouches-du-Rhône, Var',
    workTypes: [
      'Panneaux photovoltaïques',
      'Pompe à chaleur',
      'Isolation',
    ],
    requestSummary:
      'Installateur RGE — 3 techniciens — 12 chantiers/mois',
  },
} satisfies TemplateEntry
