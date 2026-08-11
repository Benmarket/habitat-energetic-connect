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

interface ArticleItem {
  title: string
  excerpt?: string
  url: string
  imageUrl?: string
  categoryLabel?: string
  publishedAtLabel?: string
  readingTime?: string
}

interface Props {
  firstName?: string
  articles?: ArticleItem[]
  recipientEmail?: string
  /** Per-recipient unsubscribe proof token */
  unsubscribeToken?: string
}

const NEWSLETTER_UNSUB_PATH = '/newsletter/desinscription'

const ArticleMiniCard = ({ article }: { article: ArticleItem }) => (
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
      borderRadius: '10px',
      overflow: 'hidden',
      backgroundColor: '#ffffff',
      boxShadow: '0 1px 6px rgba(26, 37, 54, 0.05)',
      marginBottom: '14px',
    }}
  >
    <tbody>
      {article.imageUrl && (
        <tr>
          <td style={{ padding: 0, lineHeight: 0 }}>
            <Img
              src={article.imageUrl}
              alt={article.title}
              width="556"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                objectFit: 'cover',
                maxHeight: '180px',
              }}
            />
          </td>
        </tr>
      )}
      <tr>
        <td style={{ padding: '16px 20px 18px' }}>
          {(article.categoryLabel || article.publishedAtLabel || article.readingTime) && (
            <Text
              style={{
                margin: '0 0 8px',
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: BRAND.textMuted,
                fontWeight: 700,
              }}
            >
              {[article.categoryLabel, article.publishedAtLabel, article.readingTime]
                .filter(Boolean)
                .join(' • ')}
            </Text>
          )}
          <Heading
            as="h3"
            style={{ ...h1, margin: '0 0 8px', fontSize: '17px', lineHeight: '1.35' }}
          >
            {article.title}
          </Heading>
          {article.excerpt && (
            <Text
              style={{
                ...text,
                fontSize: '14px',
                color: BRAND.textMuted,
                margin: '0 0 14px',
                lineHeight: '1.5',
              }}
            >
              {article.excerpt}
            </Text>
          )}
          <Button
            href={article.url}
            style={{
              backgroundColor: '#ffffff',
              color: BRAND.primary,
              padding: '9px 18px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-block',
              border: `2px solid ${BRAND.primary}`,
            }}
          >
            Lire l'article →
          </Button>
        </td>
      </tr>
    </tbody>
  </table>
)

const NewsletterSubscriptionConfirmationEmail = ({
  firstName,
  articles = [],
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
        💚 Bienvenue dans la newsletter Prime Énergies — voici de quoi commencer
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
                          💚 Newsletter — Bienvenue à bord
                        </Text>
                      </td>
                    </tr>
                    <tr>
                      <td style={accentBar}>&nbsp;</td>
                    </tr>

                    {/* Message de bienvenue */}
                    <tr>
                      <td style={{ padding: '32px 40px 8px 40px' }}>
                        <Heading as="h1" style={{ ...h1, margin: '0 0 12px' }}>
                          Merci pour votre inscription {firstName ? `, ${firstName}` : ''} 🎉
                        </Heading>
                        <Text style={{ ...text, margin: 0 }}>
                          Vous êtes désormais abonné(e) à la newsletter de{' '}
                          <strong style={strongAccent}>{BRAND.siteName}</strong>.
                          Chaque semaine, nous partagerons avec vous des conseils
                          concrets, des actualités et des astuces pour réussir
                          votre projet de rénovation énergétique.
                        </Text>
                      </td>
                    </tr>

                    {/* Séparateur intro articles */}
                    {articles.length > 0 && (
                      <tr>
                        <td style={{ padding: '24px 40px 4px 40px' }}>
                          <Text
                            style={{
                              margin: '0 0 4px',
                              fontSize: '11px',
                              letterSpacing: '0.14em',
                              textTransform: 'uppercase',
                              color: BRAND.textMuted,
                              fontWeight: 700,
                            }}
                          >
                            Pour commencer
                          </Text>
                          <Heading
                            as="h2"
                            style={{ ...h1, margin: 0, fontSize: '20px' }}
                          >
                            Nos 3 derniers articles
                          </Heading>
                        </td>
                      </tr>
                    )}

                    {/* Liste articles */}
                    {articles.length > 0 && (
                      <tr>
                        <td style={{ padding: '16px 40px 8px 40px' }}>
                          {articles.slice(0, 3).map((a, i) => (
                            <ArticleMiniCard key={i} article={a} />
                          ))}
                        </td>
                      </tr>
                    )}

                    {/* Merci */}
                    <tr>
                      <td style={{ padding: '20px 40px 8px 40px' }}>
                        <Text
                          style={{
                            ...text,
                            fontSize: '14px',
                            color: BRAND.textMuted,
                            textAlign: 'center',
                            margin: 0,
                          }}
                        >
                          💚 Merci de votre confiance — à très vite dans votre boîte mail !
                        </Text>
                      </td>
                    </tr>

                    {/* Footer newsletter */}
                    <tr>
                      <td style={footerSection}>
                        <Text style={footerText}>
                          Vous recevez cet email car vous venez de vous abonner
                          à la <strong>newsletter</strong> de{' '}
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
}

export const template = {
  component: NewsletterSubscriptionConfirmationEmail,
  subject: '💚 Bienvenue dans la newsletter Prime Énergies',
  displayName: 'Newsletter — Confirmation d\'inscription',
  previewData: {
    firstName: 'Marie',
    recipientEmail: 'marie@example.com',
    articles: [
      {
        title: "Panneaux solaires : pourquoi la prime à l'autoconsommation vient-elle de disparaître ?",
        excerpt:
          "C'est un véritable coup de tonnerre pour les foyers français qui projetaient de s'équiper en photovoltaïque cet été.",
        url: 'https://prime-energies.fr/actualites/exemple-1',
        imageUrl:
          'https://ggucavhanqmdxjqdbcnw.supabase.co/storage/v1/object/public/email-assets/solaire/villa-solaire.jpg',
        categoryLabel: 'Actualités',
        publishedAtLabel: 'Publié aujourd\'hui',
        readingTime: '5 min',
      },
      {
        title: 'Antilles, Guyane, Réunion : comment profiter du plan 2026 qui booste les subventions solaires',
        excerpt:
          "Habiter en Outre-mer en 2026, c'est faire face à une équation énergétique complexe.",
        url: 'https://prime-energies.fr/actualites/exemple-2',
        imageUrl:
          'https://ggucavhanqmdxjqdbcnw.supabase.co/storage/v1/object/public/email-assets/solaire/installation-toit.jpg',
        categoryLabel: 'Aides',
        publishedAtLabel: 'Il y a 2 jours',
        readingTime: '6 min',
      },
      {
        title: "Baisse des primes à l'autoconsommation depuis le 01 mai 2026 : pourquoi les ZNI tirent-elles leur épingle du jeu ?",
        excerpt:
          "Faut-il encore parier sur le solaire photovoltaïque en mai 2026 ? C'est la question que se posent de nombreux foyers.",
        url: 'https://prime-energies.fr/actualites/exemple-3',
        imageUrl:
          'https://ggucavhanqmdxjqdbcnw.supabase.co/storage/v1/object/public/email-assets/solaire/panneaux-solaires.jpg',
        categoryLabel: 'Analyse',
        publishedAtLabel: 'Il y a 5 jours',
        readingTime: '7 min',
      },
    ],
  },
} satisfies TemplateEntry
