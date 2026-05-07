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
  resetUrl?: string
}

const PasswordResetEmail = ({
  firstName,
  email,
  resetUrl = BRAND.siteUrl,
}: Props) => (
  <Html lang="fr" dir="ltr">
    <Head><meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" /><meta charSet="utf-8" /></Head>
    <Preview>Réinitialisation de votre mot de passe {BRAND.siteName}</Preview>
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
                        {firstName ? `Bonjour ${firstName},` : 'Bonjour,'}
                      </Heading>

                      <Text style={text}>
                        Vous avez demandé la <strong style={strongAccent}>réinitialisation de votre mot de passe</strong>
                        {email ? <> pour le compte <strong>{email}</strong></> : ''}.
                      </Text>

                      <Text style={text}>
                        Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.
                        Ce lien est <strong>valable 1 heure</strong> et ne peut être utilisé qu'une seule fois.
                      </Text>
                    </td>
                  </tr>

                  <tr>
                    <td style={{ padding: '0 40px' }}>
                      <Section style={ctaSection}>
                        <Heading as="h3" style={h2}>
                          Réinitialiser mon mot de passe
                        </Heading>
                        <Button href={resetUrl} style={button}>
                          Choisir un nouveau mot de passe →
                        </Button>
                        <Text style={smallText}>
                          Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br />
                          <Link href={resetUrl} style={footerLink}>{resetUrl}</Link>
                        </Text>
                      </Section>
                    </td>
                  </tr>

                  <tr>
                    <td style={hrSection}>
                      <div style={hr}>&nbsp;</div>
                    </td>
                  </tr>

                  <tr>
                    <td style={signature}>
                      <Text style={signatureText}>
                        <strong>Vous n'êtes pas à l'origine de cette demande ?</strong><br />
                        Ignorez simplement cet email — votre mot de passe actuel reste inchangé
                        et personne ne peut accéder à votre compte sans cliquer sur ce lien.
                      </Text>
                      <Text style={{ ...signatureText, marginTop: '20px' }}>
                        À très vite,<br />
                        <strong style={strongAccent}>L'équipe {BRAND.siteName}</strong>
                      </Text>
                    </td>
                  </tr>

                  <tr>
                    <td style={footerSection}>
                      <Text style={footerText}>
                        Email envoyé automatiquement suite à une demande de réinitialisation sur{' '}
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
  component: PasswordResetEmail,
  subject: `Réinitialisation de votre mot de passe | ${BRAND.siteName}`,
  displayName: 'Mot de passe oublié',
  previewData: {
    firstName: 'Jean',
    email: 'jean.dupont@example.com',
    resetUrl: 'https://prime-energies.fr/mot-de-passe-oublie?token=preview',
  },
} satisfies TemplateEntry
