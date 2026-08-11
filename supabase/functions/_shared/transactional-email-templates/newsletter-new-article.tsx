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
  h1,
  text,
  strongAccent,
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
  /** Email to prefill on the unsubscribe page (recipient) */
  recipientEmail?: string
  /** Per-recipient unsubscribe proof token */
  unsubscribeToken?: string
}

const NEWSLETTER_UNSUB_PATH = '/newsletter/desinscription'

const NewsletterNewArticleEmail = ({
  firstName,
  articleTitle = "Un nouvel article vient d'être publié",
  articleExcerpt,
  articleImageUrl,
  articleUrl = BRAND.siteUrl,
  categoryLabel,
  readingTime,
  publishedAtLabel,
  recipientEmail,
  unsubscribeToken,
}: Props) => {
  const unsubUrl = `${BRAND.siteUrl}${NEWSLETTER_UNSUB_PATH}${
    recipientEmail ? `?email=${encodeURIComponent(recipientEmail)}` : ''
  }${
    unsubscribeToken
      ? `${recipientEmail ? '&' : '?'}token=${encodeURIComponent(unsubscribeToken)}`
      : ''
  }`

  return (
    <Html lang="fr" dir="ltr">
      <Head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta charSet="utf-8" />
      </Head>
      <Preview>
        📬 Newsletter Prime Énergies — {articleTitle}
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
                    {/* Header sombre + logo */}
                    <tr>
                      <td style={header}>
                        <EmailBrandLogo />
                        <Text
                          style={{
                            margin: '14px 0 0',
                            fontSize: '12px',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            color: '#a8b3c7',
                            fontWeight: 700,
                            textAlign: 'center',
                          }}
                        >
                          📬 Newsletter — Nouvel article
                        </Text>
                      </td>
                    </tr>
                    <tr>
                      <td style={accentBar}>&nbsp;</td>
                    </tr>

                    {/* Intro personnalisée */}
                    <tr>
                      <td style={{ padding: '32px 40px 8px 40px' }}>
                        <Text style={{ ...text, margin: 0 }}>
                          {firstName ? `Bonjour ${firstName},` : 'Bonjour,'}
                        </Text>
                        <Text style={{ ...text, margin: '10px 0 0' }}>
                          Un nouvel article vient d'être publié sur{' '}
                          <strong style={strongAccent}>{BRAND.siteName}</strong>.
                          Nous avons pensé qu'il pourrait vous intéresser 👇
                        </Text>
                      </td>
                    </tr>

                    {/* Carte article — style dashboard actualités */}
                    <tr>
                      <td style={{ padding: '20px 40px 8px 40px' }}>
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          border={0}
                          style={{
                            borderCollapse: 'separate',
                            borderLeft: `4px solid ${BRAND.primary}`,
                            borderTop: `1px solid ${BRAND.borderLight}`,
                            borderRight: `1px solid ${BRAND.borderLight}`,
                            borderBottom: `1px solid ${BRAND.borderLight}`,
                            borderRadius: '12px',
                            overflow: 'hidden',
                            backgroundColor: '#ffffff',
                            boxShadow: '0 2px 12px rgba(26, 37, 54, 0.06)',
                          }}
                        >
                          <tbody>
                            {articleImageUrl && (
                              <tr>
                                <td style={{ padding: 0, lineHeight: 0 }}>
                                  <Img
                                    src={articleImageUrl}
                                    alt={articleTitle}
                                    width="556"
                                    style={{
                                      width: '100%',
                                      height: 'auto',
                                      display: 'block',
                                      objectFit: 'cover',
                                      maxHeight: '300px',
                                    }}
                                  />
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td style={{ padding: '22px 24px 24px' }}>
                                {(categoryLabel ||
                                  publishedAtLabel ||
                                  readingTime) && (
                                  <Text
                                    style={{
                                      margin: '0 0 10px',
                                      fontSize: '11px',
                                      letterSpacing: '0.1em',
                                      textTransform: 'uppercase',
                                      color: BRAND.textMuted,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {[categoryLabel, publishedAtLabel, readingTime]
                                      .filter(Boolean)
                                      .join(' • ')}
                                  </Text>
                                )}
                                <Heading
                                  as="h2"
                                  style={{ ...h1, margin: '0 0 12px', fontSize: '22px' }}
                                >
                                  {articleTitle}
                                </Heading>
                                {articleExcerpt && (
                                  <Text
                                    style={{
                                      ...text,
                                      color: BRAND.textMuted,
                                      margin: '0 0 20px',
                                    }}
                                  >
                                    {articleExcerpt}
                                  </Text>
                                )}
                                <div style={{ textAlign: 'center' }}>
                                  <Button
                                    href={articleUrl}
                                    style={{
                                      backgroundColor: '#ffffff',
                                      color: BRAND.primary,
                                      padding: '13px 26px',
                                      borderRadius: '8px',
                                      fontSize: '15px',
                                      fontWeight: 700,
                                      textDecoration: 'none',
                                      display: 'inline-block',
                                      border: `2px solid ${BRAND.primary}`,
                                    }}
                                  >
                                    Lire l'article →
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>

                    {/* Merci abonnement */}
                    <tr>
                      <td style={{ padding: '24px 40px 8px 40px' }}>
                        <Text
                          style={{
                            ...text,
                            fontSize: '14px',
                            color: BRAND.textMuted,
                            textAlign: 'center',
                            margin: 0,
                          }}
                        >
                          💚 Merci d'être abonné(e) à notre newsletter — c'est grâce à
                          vous que nous partageons chaque semaine des conseils
                          concrets sur la rénovation énergétique.
                        </Text>
                      </td>
                    </tr>

                    {/* Footer newsletter dédié */}
                    <tr>
                      <td style={footerSection}>
                        <Text style={footerText}>
                          Vous recevez cet email car vous êtes abonné(e) à la{' '}
                          <strong>newsletter</strong> de{' '}
                          <Link href={BRAND.siteUrl} style={footerLink}>
                            prime-energies.fr
                          </Link>
                          .
                          <br />
                          <span style={{ fontSize: '11px' }}>
                            <Link href={unsubUrl} style={footerLink}>
                              Me désinscrire de la newsletter
                            </Link>{' '}
                            — action instantanée, sans suppression de votre compte.
                          </span>
                          <br />
                          <br />
                          © {new Date().getFullYear()} {BRAND.siteName} — Tous
                          droits réservés
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
}

export const template = {
  component: NewsletterNewArticleEmail,
  subject: ({ articleTitle }: Props = {}) =>
    articleTitle
      ? `📬 Newsletter — ${articleTitle}`
      : `📬 Newsletter Prime Énergies — Un nouvel article vient d'être publié`,
  displayName: 'Newsletter — Nouvel article',
  previewData: {
    firstName: 'Marie',
    recipientEmail: 'marie@example.com',
    articleTitle:
      "Panneaux solaires : pourquoi la prime à l'autoconsommation vient-elle de disparaître ?",
    articleExcerpt:
      "C'est un véritable coup de tonnerre pour les foyers français qui projetaient de s'équiper en photovoltaïque cet été. En quelques semaines seulement, une aide clé a été retirée…",
    articleImageUrl:
      'https://ggucavhanqmdxjqdbcnw.supabase.co/storage/v1/object/public/email-assets/solaire/villa-solaire.jpg',
    articleUrl: 'https://prime-energies.fr/actualites/exemple-article',
    categoryLabel: 'Actualités',
    readingTime: '5 min de lecture',
    publishedAtLabel: "Publié aujourd'hui",
  },
} satisfies TemplateEntry
