/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
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
import { EmailBrandLogo } from './_email-brand-logo.tsx'

interface Props {
  firstName?: string
  email?: string
  guideTitle?: string
  guideUrl?: string
  activationUrl?: string
}

const GuideDownloadConfirmationEmail = ({
  firstName,
  email,
  guideTitle = 'votre guide',
  guideUrl = BRAND.siteUrl,
  activationUrl,
}: Props) => (
  <Html lang="fr" dir="ltr">
    <Head />
    <Preview>Votre guide « {guideTitle} » est prêt à être consulté</Preview>
    <Body style={main}>
      <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} border={0} style={wrapper}>
        <tbody>
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellPadding={0} cellSpacing={0} border={0} style={card}>
                <tbody>
                  <tr>
                    <td style={header}>
                      <EmailBrandLogo />
                    </td>
                  </tr>
                  <tr>
                    <td style={accentBar}>&nbsp;</td>
                  </tr>

                  <tr>
                    <td style={contentSection}>
                      <Heading as="h2" style={h1}>
                        {firstName ? `Merci ${firstName} !` : 'Merci pour votre intérêt !'}
                      </Heading>

                      <Text style={text}>
                        Votre guide{' '}
                        <strong style={strongAccent}>« {guideTitle} »</strong>{' '}
                        est désormais accessible. Vous pouvez le consulter en
                        ligne ou le télécharger en PDF en un clic.
                      </Text>

                      <Section style={recapBox}>
                        <Text style={recapTitle}>Votre accès au guide</Text>
                        <Text style={recapItem}>
                          <strong>Guide :</strong> {guideTitle}
                        </Text>
                        {email && (
                          <Text style={recapItem}>
                            <strong>Email :</strong> {email}
                          </Text>
                        )}
                      </Section>
                    </td>
                  </tr>

                  {/* CTA principal : lire le guide */}
                  <tr>
                    <td style={{ padding: '0 40px' }}>
                      <Section style={ctaSection}>
                        <Heading as="h3" style={h2}>
                          Accédez à votre guide
                        </Heading>
                        <Text style={{ ...text, margin: '0 0 20px 0' }}>
                          Cliquez ci-dessous pour ouvrir le guide complet.
                          Depuis la page, un bouton vous permettra de
                          l'imprimer ou le sauvegarder en PDF (format
                          identique à la version web).
                        </Text>
                        <Button href={guideUrl} style={button}>
                          Lire le guide en ligne →
                        </Button>
                        <Text style={smallText}>
                          Astuce : sur la page du guide, cliquez sur
                          « Télécharger le guide » pour obtenir une version
                          PDF prête à imprimer ou à partager.
                        </Text>
                      </Section>
                    </td>
                  </tr>

                  {activationUrl && (
                    <>
                      <tr>
                        <td style={hrSection}>
                          <div style={hr}>&nbsp;</div>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0 40px' }}>
                          <Section style={ctaSection}>
                            <Heading as="h3" style={h2}>
                              Activez votre espace personnel
                            </Heading>
                            <Text style={{ ...text, margin: '0 0 20px 0' }}>
                              Retrouvez tous vos guides téléchargés et accédez à
                              nos contenus premium en activant votre espace.
                            </Text>
                            <Button href={activationUrl} style={button}>
                              Créer mon espace membre →
                            </Button>
                            <Text style={smallText}>
                              Lien personnel valable 7 jours.
                            </Text>
                          </Section>
                        </td>
                      </tr>
                    </>
                  )}

                  <tr>
                    <td style={hrSection}>
                      <div style={hr}>&nbsp;</div>
                    </td>
                  </tr>

                  <tr>
                    <td style={signature}>
                      <Text style={signatureText}>
                        Bonne lecture,<br />
                        <strong style={strongAccent}>L'équipe {BRAND.siteName}</strong>
                      </Text>
                    </td>
                  </tr>

                  <tr>
                    <td style={footerSection}>
                      <Text style={footerText}>
                        Cet email vous est envoyé suite à votre téléchargement de
                        guide sur{' '}
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
  component: GuideDownloadConfirmationEmail,
  subject: ({ guideTitle }: Props = {}) =>
    `Votre guide${guideTitle ? ` « ${guideTitle} »` : ''} est prêt | ${BRAND.siteName}`,
  displayName: 'Confirmation téléchargement de guide',
  previewData: {
    firstName: 'Jean',
    email: 'jean.dupont@example.com',
    guideTitle: 'Pompe à chaleur : le guide complet 2026',
    guideUrl: 'https://prime-energies.fr/guides/pompe-a-chaleur-guide-complet',
    activationUrl: 'https://prime-energies.fr/inscription/activer?token=preview',
  },
} satisfies TemplateEntry
