/**
 * Design system partagé pour TOUS les emails transactionnels Prime Énergies.
 * Inspiré du template pro FRH (fond gris, conteneur blanc arrondi, header coloré,
 * accent doré, encadrés à bordure gauche, liste stylisée, footer minimal).
 *
 * Règle : on importe ces tokens dans chaque template (lead-confirmation-*.tsx)
 * pour garantir une cohérence visuelle parfaite entre tous les emails envoyés.
 *
 * Couleurs marque Prime Énergies :
 *   - Vert primaire : #0a6b3f
 *   - Vert foncé header : #0d5a36
 *   - Accent doré : #f5a623 → #f7c948
 */

export const BRAND = {
  siteName: 'Prime Énergies',
  siteUrl: 'https://prime-energies.fr',
  tagline: 'Votre partenaire en rénovation énergétique',
  primary: '#0a6b3f',
  primaryDark: '#0d5a36',
  primaryLight: '#e8f5ef',
  accent: '#f5a623',
  accentLight: '#f7c948',
  textDark: '#1a2332',
  textBody: '#2d3748',
  textMuted: '#718096',
  textFooter: '#a0aec0',
  borderLight: '#edf0f4',
  surfacePage: '#f0f2f5',
  surfaceCard: '#ffffff',
  surfaceMuted: '#fafbfc',
  surfaceInfo: '#e8f5ef',
  surfaceWarn: '#fff8ed',
} as const

// ===== Layout =====
export const main = {
  margin: 0,
  padding: 0,
  backgroundColor: BRAND.surfacePage,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  WebkitFontSmoothing: 'antialiased' as const,
}

export const wrapper = {
  width: '100%',
  backgroundColor: BRAND.surfacePage,
  padding: '24px 16px',
}

export const card = {
  maxWidth: '640px',
  width: '100%',
  margin: '0 auto',
  backgroundColor: BRAND.surfaceCard,
  borderRadius: '12px',
  overflow: 'hidden' as const,
  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
}

// ===== Header =====
export const header = {
  backgroundColor: BRAND.primary,
  padding: '28px 32px 24px 32px',
}

export const headerBrand = {
  margin: 0,
  padding: 0,
  fontSize: '26px',
  fontWeight: 800,
  lineHeight: '1.15',
  color: '#ffffff',
  letterSpacing: '-0.3px',
}

export const headerTagline = {
  margin: '8px 0 0 0',
  fontSize: '13px',
  lineHeight: '1.5',
  color: '#c9e8d8',
  fontStyle: 'italic' as const,
}

// Bande dorée fine (4px) sous le header — accent visuel signature
export const accentBar = {
  background: `linear-gradient(90deg, ${BRAND.accent} 0%, ${BRAND.accentLight} 100%)`,
  backgroundColor: BRAND.accent, // fallback clients qui ne supportent pas le gradient
  height: '4px',
  fontSize: '0',
  lineHeight: '0',
}

// Bande de fermeture verte épaisse en bas (6px)
export const footerBar = {
  backgroundColor: BRAND.primary,
  height: '6px',
  fontSize: '0',
  lineHeight: '0',
}

// ===== Body content =====
export const contentSection = {
  padding: '32px 36px 8px 36px',
}

export const h1 = {
  margin: '0 0 18px 0',
  fontSize: '24px',
  fontWeight: 700,
  lineHeight: '1.3',
  color: BRAND.textDark,
}

export const h2 = {
  margin: '0 0 12px 0',
  fontSize: '18px',
  fontWeight: 700,
  lineHeight: '1.3',
  color: BRAND.textDark,
}

export const text = {
  margin: '0 0 16px 0',
  fontSize: '15px',
  lineHeight: '1.7',
  color: BRAND.textBody,
}

export const strongAccent = {
  color: BRAND.primary,
  fontWeight: 700,
}

export const smallText = {
  margin: '12px 0 0 0',
  fontSize: '12px',
  lineHeight: '1.5',
  color: BRAND.textMuted,
  textAlign: 'center' as const,
}

// ===== Encadré récapitulatif (bordure gauche colorée) =====
export const recapBox = {
  backgroundColor: BRAND.primaryLight,
  borderLeft: `4px solid ${BRAND.primary}`,
  borderRadius: '0 8px 8px 0',
  padding: '18px 22px',
  margin: '20px 0',
}

export const recapTitle = {
  margin: '0 0 10px 0',
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  color: BRAND.primary,
}

export const recapItem = {
  margin: '6px 0',
  fontSize: '14px',
  lineHeight: '1.6',
  color: BRAND.textBody,
}

// ===== Encadré CTA (action principale) =====
export const ctaSection = {
  backgroundColor: BRAND.surfaceMuted,
  borderRadius: '12px',
  padding: '24px 28px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

export const button = {
  backgroundColor: BRAND.primary,
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
  boxShadow: `0 2px 8px ${BRAND.primary}40`,
}

export const buttonSecondary = {
  backgroundColor: '#1e40af',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
  boxShadow: '0 2px 8px rgba(30, 64, 175, 0.25)',
}

// ===== Séparateurs =====
export const hrSection = {
  padding: '0 36px',
}

export const hr = {
  borderTop: `1px solid ${BRAND.borderLight}`,
  borderBottom: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  margin: 0,
  height: '1px',
}

// ===== Signature =====
export const signature = {
  padding: '8px 36px 28px 36px',
}

export const signatureText = {
  margin: 0,
  fontSize: '15px',
  lineHeight: '1.7',
  color: BRAND.textBody,
}

// ===== Footer (informations société) =====
export const footerSection = {
  padding: '20px 36px 26px 36px',
  textAlign: 'center' as const,
}

export const footerText = {
  margin: 0,
  fontSize: '11px',
  lineHeight: '1.6',
  color: BRAND.textFooter,
}

export const footerLink = {
  color: BRAND.primary,
  textDecoration: 'none',
  fontWeight: 700,
}
