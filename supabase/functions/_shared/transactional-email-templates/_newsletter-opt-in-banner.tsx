/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Heading, Section, Text } from 'npm:@react-email/components@0.0.22'

interface Props {
  url?: string
}

/**
 * Card-style opt-in block inspired by the site's ArticleCard component:
 * white surface, subtle border, left green accent, bold title, muted excerpt,
 * outlined green CTA button. Rendered inside lead-confirmation emails.
 */
export const NewsletterOptInBanner = ({ url }: Props) => {
  if (!url) return null
  return (
    <tr>
      <td style={{ padding: '0 40px 28px 40px' }}>
        <Section
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderLeft: '4px solid #10b981',
            borderRadius: '14px',
            padding: '24px 26px',
            boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
          }}
        >
          <Text
            style={{
              margin: '0 0 10px 0',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#10b981',
            }}
          >
            Newsletter Prime Energies
          </Text>
          <Heading
            as="h3"
            style={{
              margin: '0 0 10px 0',
              fontSize: '20px',
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
            }}
          >
            Restez informé des dernières actualités énergie
          </Heading>
          <Text
            style={{
              margin: '0 0 20px 0',
              fontSize: '14px',
              lineHeight: 1.6,
              color: '#64748b',
            }}
          >
            Aides, primes, économies et innovations : recevez chaque nouvelle
            publication directement dans votre boîte mail. Inscription en un
            clic, sans formulaire.
          </Text>
          <Button
            href={url}
            style={{
              backgroundColor: '#ffffff',
              color: '#10b981',
              padding: '12px 24px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-block',
              border: '1.5px solid #10b981',
            }}
          >
            Je m'inscris en 1 clic →
          </Button>
        </Section>
      </td>
    </tr>
  )
}
