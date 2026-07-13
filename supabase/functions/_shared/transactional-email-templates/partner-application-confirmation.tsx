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

/**
 * Confirmation email — B2B partner application.
 * Palette orange/ambre, ton pro, aucun magic link (les pros ne s'inscrivent
 * pas en un clic depuis l'espace membre grand public).
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

// ---- Styles inline (palette orange B2B) ----
const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Arial, Helvetica, sans-serif',
  margin: 0,
  padding: 0,
}
const wrapper = { padding: '24px 12px' }
const card = {
  backgroundColor: '#ffffff',
  border: '1px solid #f3d9b1',
  borderRadius: '16px',
  overflow: 'hidden' as const,
}
const heroBar = {
  background: 'linear-gradient(135deg, #d97706 0%, #f97316 55%, #ea580c 100%)',
  padding: '32px 32px 40px 32px',
  color: '#ffffff',
}
const heroBadge = {
  display: 'inline-block' as const,
  padding: '6px 14px',
  borderRadius: '999px',
  background: 'rgba(255,255,255,0.18)',
  border: '1px solid rgba(255,255,255,0.35)',
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  marginBottom: '14px',
}
const heroH1 = {
  color: '#ffffff',
  fontSize: '26px',
  lineHeight: '1.25',
  margin: '0 0 8px 0',
  fontWeight: 800,
}
const heroSub = {
  color: 'rgba(255,255,255,0.92)',
  fontSize: '15px',
  margin: 0,
  lineHeight: '1.55',
}
const content = { padding: '28px 32px 8px 32px' }
const paragraph = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.65',
  margin: '0 0 14px 0',
}
const strongAccent = { color: '#c2410c', fontWeight: 700 as const }

const stepsSection = { padding: '4px 32px 20px 32px' }
const stepRow = {
  display: 'block' as const,
  padding: '12px 14px',
  border: '1px solid #fed7aa',
  borderLeft: '4px solid #f97316',
  borderRadius: '10px',
  background: '#fff7ed',
  marginBottom: '10px',
}
const stepTitle = {
  color: '#9a3412',
  fontSize: '13px',
  fontWeight: 800 as const,
  margin: '0 0 3px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
}
const stepDesc = { color: '#57534e', fontSize: '14px', margin: 0, lineHeight: '1.55' }

const recapBox = {
  background: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '12px',
  padding: '18px 20px',
  margin: '4px 32px 20px 32px',
}
const recapTitle = {
  color: '#78350f',
  fontSize: '12px',
  fontWeight: 800 as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  margin: '0 0 10px 0',
}
const recapItem = {
  color: '#4b5563',
  fontSize: '14px',
  margin: '0 0 6px 0',
  lineHeight: '1.5',
}

const signatureSection = { padding: '8px 32px 24px 32px' }
const signatureText = {
  color: '#4b5563',
  fontSize: '14px',
  lineHeight: '1.65',
  margin: 0,
}
const footerSection = {
  background: '#fef3c7',
  padding: '18px 32px',
  borderTop: '1px solid #fde68a',
}
const footerText = {
  color: '#78716c',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: 0,
  textAlign: 'center' as const,
}
const footerLink = { color: '#c2410c', textDecoration: 'underline' }
const bottomBar = {
  background: 'linear-gradient(90deg,#d97706,#ea580c,#c2410c)',
  height: '6px',
}

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
    workTypes && workTypes.length > 0
      ? workTypes.join(' • ')
      : undefined

  return (
    <Html lang="fr" dir="ltr">
      <Head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta charSet="utf-8" />
      </Head>
      <Preview>Votre candidature partenaire a bien été reçue — {SITE_NAME}</Preview>
      <Body style={main}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={wrapper}>
          <tbody>
            <tr>
              <td align="center">
                <table role="presentation" width="640" cellPadding={0} cellSpacing={0} border={0} style={card}>
                  <tbody>
                    {/* HERO orange dégradé B2B */}
                    <tr>
                      <td style={heroBar}>
                        <span style={heroBadge}>Espace professionnels</span>
                        <Heading as="h1" style={heroH1}>
                          {firstName
                            ? `Merci ${firstName}, votre candidature est enregistrée`
                            : 'Votre candidature partenaire est enregistrée'}
                        </Heading>
                        <Text style={heroSub}>
                          Notre équipe partenariats étudie votre dossier avec attention.
                        </Text>
                      </td>
                    </tr>

                    {/* CORPS */}
                    <tr>
                      <td style={content}>
                        <Text style={paragraph}>
                          Bonjour{firstName ? ` ${firstName}` : ''},
                        </Text>
                        <Text style={paragraph}>
                          Nous avons bien reçu la candidature de{' '}
                          <strong style={strongAccent}>{companyName || 'votre entreprise'}</strong>{' '}
                          pour rejoindre le réseau {SITE_NAME}.
                        </Text>
                        <Text style={paragraph}>
                          Contrairement aux demandes de nos particuliers, une candidature
                          professionnelle nécessite une vérification approfondie de votre
                          conformité au <strong>cahier des charges des primes énergies</strong>{' '}
                          (certification RGE, assurance décennale, ancienneté SIRET, références).
                        </Text>
                      </td>
                    </tr>

                    {/* ÉTAPES */}
                    <tr>
                      <td style={stepsSection}>
                        <div style={stepRow}>
                          <Text style={stepTitle}>Étape 1 — Analyse du dossier</Text>
                          <Text style={stepDesc}>
                            Vérification de vos qualifications sous <strong>48 à 72h ouvrées</strong>.
                          </Text>
                        </div>
                        <div style={stepRow}>
                          <Text style={stepTitle}>Étape 2 — Entretien de cadrage</Text>
                          <Text style={stepDesc}>
                            Si votre dossier est retenu, un chargé de partenariats vous contactera
                            pour préciser vos zones d'intervention et volumes.
                          </Text>
                        </div>
                        <div style={stepRow}>
                          <Text style={stepTitle}>Étape 3 — Activation du compte</Text>
                          <Text style={stepDesc}>
                            Mise en ligne de vos offres et démarrage de la réception des leads
                            qualifiés dans votre secteur.
                          </Text>
                        </div>
                      </td>
                    </tr>

                    {/* RÉCAPITULATIF */}
                    {(companyName || email || phone || zone || worksLine || requestSummary) && (
                      <tr>
                        <td>
                          <Section style={recapBox}>
                            <Text style={recapTitle}>Récapitulatif de votre candidature</Text>
                            {companyName && (
                              <Text style={recapItem}>
                                <strong>Entreprise :</strong> {companyName}
                              </Text>
                            )}
                            {email && (
                              <Text style={recapItem}>
                                <strong>Email pro :</strong> {email}
                              </Text>
                            )}
                            {phone && (
                              <Text style={recapItem}>
                                <strong>Téléphone :</strong> {phone}
                              </Text>
                            )}
                            {zone && (
                              <Text style={recapItem}>
                                <strong>Zone d'intervention :</strong> {zone}
                              </Text>
                            )}
                            {worksLine && (
                              <Text style={recapItem}>
                                <strong>Activités :</strong> {worksLine}
                              </Text>
                            )}
                            {!worksLine && requestSummary && (
                              <Text style={recapItem}>
                                <strong>Résumé :</strong> {requestSummary}
                              </Text>
                            )}
                          </Section>
                        </td>
                      </tr>
                    )}

                    {/* GALERIE — même bibliothèque d'images que les autres templates,
                        variante "mix" pour illustrer la diversité des projets */}
                    <WorkGallery
                      workType="mix"
                      title="Nos projets partenaires en images"
                      hint="rénovation énergétique partenaires"
                    />

                    {/* SIGNATURE */}
                    <tr>
                      <td style={signatureSection}>
                        <Text style={signatureText}>
                          À très vite,
                          <br />
                          <strong style={strongAccent}>L'équipe Partenariats — {SITE_NAME}</strong>
                        </Text>
                      </td>
                    </tr>

                    {/* FOOTER B2B */}
                    <tr>
                      <td style={footerSection}>
                        <Text style={footerText}>
                          Email transactionnel envoyé suite à votre candidature sur{' '}
                          <Link href={`${SITE_URL}/devenir-partenaire`} style={footerLink}>
                            {SITE_URL.replace('https://', '')}/devenir-partenaire
                          </Link>
                          <br />© {new Date().getFullYear()} {SITE_NAME} — Réseau de professionnels certifiés RGE
                        </Text>
                      </td>
                    </tr>

                    <tr>
                      <td style={bottomBar}>&nbsp;</td>
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
    workTypes: ['Panneaux photovoltaïques', 'Pompe à chaleur', 'Isolation'],
    requestSummary: 'Installateur RGE — 3 techniciens — 12 chantiers/mois',
  },
} satisfies TemplateEntry
