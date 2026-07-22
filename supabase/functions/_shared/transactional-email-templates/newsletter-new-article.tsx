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
  text,
  strongAccent,
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
  articleTitle?: string
  articleExcerpt?: string
  articleImageUrl?: string
  articleUrl?: string
  categoryLabel?: string
  readingTime?: string
  publishedAtLabel?: string
}

const NewsletterNewArticleEmail = ({
  firstName,
  articleTitle = 'Un nouvel article vient d\'être publié',
  articleExcerpt,
  articleImageUrl,
  articleUrl = BRAND.siteUrl,
  categoryLabel,
  readingTime,
  publishedAtLabel,
}: Props) => (
  <Html lang="fr" dir="ltr">
    <Head>
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      <meta charSet="utf-8" />
    </Head>
    <Preview>{articleTitle}</Preview>
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

                  {articleImageUrl && (
                    <tr>
                      <td style={{ padding: 0 }}>
                        <Img
                          src={articleImageUrl}
                          alt={articleTitle}
                          width="640"
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                            objectFit: 'cover',
                            maxHeight: '340px',
                          }}
                        />
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td style={contentSection}>
                      {(categoryLabel || readingTime || publishedAtLabel) && (
                        <Text
                          style={{
                            margin: '0 0 12px',
                            fontSize: '12px',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: BRAND.textMuted,
                            fontWeight: 600,
                          }}
                        >
                          {[categoryLabel, publishedAtLabel, readingTime]
                            .filter(Boolean)
                            .join(' • ')}
                        </Text>
                      )}

                      <Heading as="h2" style={h1}>
                        {articleTitle}
                      </Heading>

                      <Text style={text}>
                        {firstName ? `Bonjour ${firstName},` : 'Bonjour,'} nous venons de
                        publier un nouvel article sur{' '}
                        <strong style={strongAccent}>{BRAND.siteName}</strong>.
                      </Text>

                      {articleExcerpt && (
                        <Text
                          style={{
                            ...text,
                            fontStyle: 'italic',
                            color: BRAND.textBody,
                            borderLeft: `3px solid ${BRAND.accent}`,
                            paddingLeft: '14px',
                            margin: '18px 0',
                          }}
                        >
                          {articleExcerpt}
                        </Text>
                      )}

                      <div style={{ textAlign: 'center', margin: '28px 0 8px' }}>
                        <Button
                          href={articleUrl}
                          style={{
                            backgroundColor: BRAND.primary,
                            color: '#ffffff',
                            padding: '14px 28px',
                            borderRadius: '8px',
                            fontSize: '15px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'inline-block',
                          }}
                        >
                          Lire l'article →
                        </Button>
                      </div>
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
                        Bonne lecture,<br />
                        <strong style={strongAccent}>L'équipe {BRAND.siteName}</strong>
                      </Text>
                    </td>
                  </tr>

                  <tr>
                    <td style={footerSection}>
                      <Text style={footerText}>
                        Vous recevez cet email car vous êtes abonné(e) à la newsletter de{' '}
                        <Link href={BRAND.siteUrl} style={footerLink}>
                          prime-energies.fr
                        </Link>
                        <br />
                        © {new Date().getFullYear()} {BRAND.siteName} — Tous droits réservés
                        <br />
                        <span style={{ fontSize: '11px', color: '#9aa3b2' }}>
                          Vous pouvez vous désabonner à tout moment{' '}
                          <Link href={`${BRAND.siteUrl}/desinscription-registre`} style={footerLink}>
                            ici
                          </Link>.
                        </span>
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
  component: NewsletterNewArticleEmail,
  subject: ({ articleTitle }: Props = {}) =>
    articleTitle
      ? `📰 ${articleTitle} | ${BRAND.siteName}`
      : `Un nouvel article vient d'être publié | ${BRAND.siteName}`,
  displayName: 'Newsletter — Nouvel article',
  previewData: {
    firstName: 'Marie',
    articleTitle: 'Panneaux solaires en 2026 : ce qui change pour les particuliers',
    articleExcerpt:
      'Nouveaux tarifs de rachat, évolutions des aides et rentabilité : voici tout ce qu\'il faut savoir avant de lancer votre projet solaire cette année.',
    articleImageUrl:
      'https://ggucavhanqmdxjqdbcnw.supabase.co/storage/v1/object/public/email-assets/gallery/solaire/solaire-1.jpg',
    articleUrl: 'https://prime-energies.fr/actualites/exemple-article',
    categoryLabel: 'Actualités',
    readingTime: '5 min de lecture',
    publishedAtLabel: 'Publié aujourd\'hui',
  },
} satisfies TemplateEntry
