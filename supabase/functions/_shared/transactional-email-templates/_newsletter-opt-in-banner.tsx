/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Button, Heading, Section, Text } from 'npm:@react-email/components@0.0.22'

interface Props {
  url?: string
}

/**
 * Small green CTA banner inserted in lead-confirmation emails to invite the
 * recipient to opt-in to the newsletter in one click. Mimics the visual style
 * of the site's actualités (news) cards: rounded, subtle border, green accent.
 * Renders nothing when `url` is missing (admin toggle OFF).
 */
export const NewsletterOptInBanner = ({ url }: Props) => {
  if (!url) return null
  return (
    <tr>
      <td style={{ padding: '0 40px 24px 40px' }}>
        <Section
          style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
            border: '1px solid #a7f3d0',
            borderLeft: '4px solid #059669',
            borderRadius: '12px',
            padding: '20px 22px',
          }}
        >
          <Heading
            as="h3"
            style={{
              margin: '0 0 6px 0',
              fontSize: '17px',
              fontWeight: 700,
              color: '#065f46',
              lineHeight: 1.3,
            }}
          >
            📩 Recevez nos actualités énergie
          </Heading>
          <Text
            style={{
              margin: '0 0 14px 0',
              fontSize: '14px',
              lineHeight: 1.55,
              color: '#065f46',
            }}
          >
            Aides, économies, innovations : rejoignez notre newsletter en
            <strong> 1 clic</strong>, sans remplir de formulaire.
          </Text>
          <Button
            href={url}
            style={{
              backgroundColor: '#059669',
              color: '#ffffff',
              padding: '11px 22px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Je m'inscris en 1 clic →
          </Button>
        </Section>
      </td>
    </tr>
  )
}
