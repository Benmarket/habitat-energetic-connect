/**
 * Design system partagé pour TOUS les emails transactionnels Prime Énergies.
 *
 * Direction artistique :
 *   - Header sombre élégant (gris bleuté nuit) avec logo Prime Énergies
 *   - Accent doré subtil (signature visuelle haut de gamme)
 *   - Carte blanche centrée 640px avec coins arrondis
 *   - Typographie soignée, hiérarchie claire
 *   - Galerie d'images thématique selon le type de travaux
 */

const STORAGE_BASE =
  'https://ggucavhanqmdxjqdbcnw.supabase.co/storage/v1/object/public/email-assets'

export const BRAND = {
  siteName: 'Prime Énergies',
  siteUrl: 'https://prime-energies.fr',
  tagline: 'Votre partenaire en rénovation énergétique',

  // Logo hébergé sur Supabase Storage (public)
  logoUrl: `${STORAGE_BASE}/logo-prime-energies.png`,

  // Header sombre gris-bleu nuit (remplace l'ancien vert)
  headerBg: '#1a2536',
  headerBgGradient: 'linear-gradient(135deg, #1a2536 0%, #243246 60%, #2d3e57 100%)',

  // Accents
  primary: '#0a6b3f', // vert pour boutons CTA et accents textuels (cohérence marque)
  primaryDark: '#085a35',
  primaryLight: '#e8f5ef',
  accent: '#f5a623', // doré signature
  accentLight: '#f7c948',

  // Texte
  textDark: '#1a2332',
  textBody: '#2d3748',
  textMuted: '#718096',
  textFooter: '#9aa3b2',

  // Surfaces
  borderLight: '#edf0f4',
  surfacePage: '#eef1f5',
  surfaceCard: '#ffffff',
  surfaceMuted: '#f8fafc',
} as const

// ===== Galerie d'images par type de travaux =====
// Hébergées sur Supabase Storage (lecture publique).
// Aspect ratio 4:3 — affichage en grille 3 colonnes dans l'email.

export type WorkType =
  | 'solaire'
  | 'isolation'
  | 'chauffage'
  | 'renovation'
  | 'mix'
  | 'none'

interface GalleryImage {
  src: string
  alt: string
}

const SOLAR_IMAGES: GalleryImage[] = [
  { src: `${STORAGE_BASE}/solaire/villa-solaire.jpg`, alt: 'Villa équipée de panneaux solaires' },
  { src: `${STORAGE_BASE}/solaire/installation-toit.jpg`, alt: 'Installation solaire sur toiture' },
  { src: `${STORAGE_BASE}/solaire/panneaux-solaires.jpg`, alt: 'Panneaux photovoltaïques en gros plan' },
]

const ISOLATION_IMAGES: GalleryImage[] = [
  { src: `${STORAGE_BASE}/isolation/combles.jpg`, alt: 'Isolation des combles soufflée' },
  { src: `${STORAGE_BASE}/isolation/exterieur.jpg`, alt: 'Isolation thermique extérieure' },
  { src: `${STORAGE_BASE}/isolation/pose-murs.jpg`, alt: 'Pose d’isolation intérieure' },
]

const CHAUFFAGE_IMAGES: GalleryImage[] = [
  { src: `${STORAGE_BASE}/chauffage/pac-exterieur.jpg`, alt: 'Pompe à chaleur extérieure' },
  { src: `${STORAGE_BASE}/chauffage/pac-interieur.jpg`, alt: 'Confort intérieur grâce à la PAC' },
  { src: `${STORAGE_BASE}/chauffage/poele-granules.jpg`, alt: 'Poêle à granulés design' },
]

const RENOVATION_IMAGES: GalleryImage[] = [
  { src: `${STORAGE_BASE}/renovation/maison-globale.jpg`, alt: 'Maison après rénovation globale' },
  { src: `${STORAGE_BASE}/renovation/conseil.jpg`, alt: 'Étude de projet avec un conseiller' },
  { src: `${STORAGE_BASE}/renovation/audit.jpg`, alt: 'Audit énergétique du logement' },
]

const MIX_IMAGES: GalleryImage[] = [
  SOLAR_IMAGES[0],
  ISOLATION_IMAGES[1],
  CHAUFFAGE_IMAGES[0],
]

/**
 * Détecte le type de travaux à partir d'un libellé libre (formLabel ou
 * requestSummary). Renvoie 'none' si aucun mot-clé connu n'est trouvé →
 * dans ce cas, le template n'affiche AUCUNE galerie (rendu sobre).
 */
export function detectWorkType(input?: string | null): WorkType {
  if (!input) return 'none'
  const s = input.toLowerCase()

  // Cas explicite "je ne sais pas" / mix
  if (
    s.includes('je ne sais pas') ||
    s.includes('je sais pas') ||
    s.includes('plusieurs') ||
    s.includes('global')
  ) {
    // 'global' couvre aussi "rénovation globale" → priorité plus bas
  }

  // Solaire / photovoltaïque
  if (
    s.includes('solair') ||
    s.includes('photovolta') ||
    s.includes('panneau') ||
    s.includes('pv')
  ) {
    return 'solaire'
  }

  // Rénovation globale (avant chauffage/isolation pris séparément)
  if (
    s.includes('rénovation glob') ||
    s.includes('renovation glob') ||
    s.includes('rénovation d’ampleur') ||
    s.includes('renovation d’ampleur') ||
    s.includes("rénovation d'ampleur") ||
    s.includes("renovation d'ampleur") ||
    s.includes('ampleur')
  ) {
    return 'renovation'
  }

  // Isolation
  if (
    s.includes('isolation') ||
    s.includes('isoler') ||
    s.includes('comble') ||
    s.includes('ite')
  ) {
    return 'isolation'
  }

  // Chauffage / PAC / poêle
  if (
    s.includes('chauffage') ||
    s.includes('pompe à chaleur') ||
    s.includes('pompe a chaleur') ||
    s.includes('pac') ||
    s.includes('poêle') ||
    s.includes('poele') ||
    s.includes('chaudière') ||
    s.includes('chaudiere') ||
    s.includes('granulé') ||
    s.includes('granule')
  ) {
    return 'chauffage'
  }

  // Mix / je ne sais pas
  if (
    s.includes('je ne sais pas') ||
    s.includes('je sais pas') ||
    s.includes('plusieurs') ||
    s.includes('mix') ||
    s.includes('autre')
  ) {
    return 'mix'
  }

  return 'none'
}

export function getGalleryImages(workType: WorkType): GalleryImage[] {
  switch (workType) {
    case 'solaire':
      return SOLAR_IMAGES
    case 'isolation':
      return ISOLATION_IMAGES
    case 'chauffage':
      return CHAUFFAGE_IMAGES
    case 'renovation':
      return RENOVATION_IMAGES
    case 'mix':
      return MIX_IMAGES
    case 'none':
    default:
      return []
  }
}

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
  padding: '32px 16px',
}

export const card = {
  maxWidth: '640px',
  width: '100%',
  margin: '0 auto',
  backgroundColor: BRAND.surfaceCard,
  borderRadius: '14px',
  overflow: 'hidden' as const,
  boxShadow: '0 4px 24px rgba(26, 37, 54, 0.10)',
}

// ===== Header (sombre, avec logo) =====
export const header = {
  background: BRAND.headerBgGradient,
  backgroundColor: BRAND.headerBg,
  padding: '32px 32px 28px 32px',
  textAlign: 'center' as const,
}

export const logoImg = {
  display: 'block',
  margin: '0 auto 14px auto',
  height: '52px',
  width: 'auto',
}

export const headerBrand = {
  margin: 0,
  padding: 0,
  fontSize: '22px',
  fontWeight: 700,
  lineHeight: '1.2',
  color: '#ffffff',
  letterSpacing: '0.3px',
}

export const headerTagline = {
  margin: '6px 0 0 0',
  fontSize: '13px',
  lineHeight: '1.5',
  color: '#a8b3c7',
  fontWeight: 400,
}

// Bande dorée fine (3px) sous le header
export const accentBar = {
  background: `linear-gradient(90deg, ${BRAND.accent} 0%, ${BRAND.accentLight} 100%)`,
  backgroundColor: BRAND.accent,
  height: '3px',
  fontSize: '0',
  lineHeight: '0',
}

// Bande de fermeture sombre épaisse en bas (6px)
export const footerBar = {
  backgroundColor: BRAND.headerBg,
  height: '6px',
  fontSize: '0',
  lineHeight: '0',
}

// ===== Body content =====
export const contentSection = {
  padding: '36px 40px 8px 40px',
}

export const h1 = {
  margin: '0 0 18px 0',
  fontSize: '24px',
  fontWeight: 700,
  lineHeight: '1.3',
  color: BRAND.textDark,
  letterSpacing: '-0.2px',
}

export const h2 = {
  margin: '0 0 14px 0',
  fontSize: '17px',
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
  margin: '14px 0 0 0',
  fontSize: '12px',
  lineHeight: '1.5',
  color: BRAND.textMuted,
  textAlign: 'center' as const,
}

// ===== Encadré récapitulatif =====
export const recapBox = {
  backgroundColor: BRAND.primaryLight,
  borderLeft: `4px solid ${BRAND.primary}`,
  borderRadius: '0 8px 8px 0',
  padding: '18px 22px',
  margin: '22px 0',
}

export const recapTitle = {
  margin: '0 0 10px 0',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '1.2px',
  color: BRAND.primary,
}

export const recapItem = {
  margin: '6px 0',
  fontSize: '14px',
  lineHeight: '1.6',
  color: BRAND.textBody,
}

// ===== CTA =====
export const ctaSection = {
  backgroundColor: BRAND.surfaceMuted,
  borderRadius: '12px',
  padding: '26px 28px',
  margin: '24px 0',
  textAlign: 'center' as const,
  border: `1px solid ${BRAND.borderLight}`,
}

export const button = {
  backgroundColor: BRAND.primary,
  color: '#ffffff',
  padding: '14px 34px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
  boxShadow: `0 3px 10px ${BRAND.primary}40`,
}

export const buttonSecondary = {
  backgroundColor: BRAND.headerBg,
  color: '#ffffff',
  padding: '14px 34px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'inline-block',
  boxShadow: `0 3px 10px rgba(26, 37, 54, 0.30)`,
}

// ===== Galerie d'images =====
export const gallerySection = {
  padding: '8px 40px 24px 40px',
}

export const galleryTitle = {
  margin: '0 0 14px 0',
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '1.2px',
  color: BRAND.textMuted,
  textAlign: 'center' as const,
}

export const galleryImage = {
  display: 'block',
  width: '180px',
  height: '135px',
  maxWidth: '100%',
  objectFit: 'cover' as const,
  objectPosition: 'center' as const,
  borderRadius: '8px',
  border: `1px solid ${BRAND.borderLight}`,
  margin: '0 auto',
}

export const galleryCell = {
  padding: '0 4px',
  width: '33.33%',
  verticalAlign: 'middle' as const,
  textAlign: 'center' as const,
}

// ===== Séparateur =====
export const hrSection = {
  padding: '0 40px',
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
  padding: '12px 40px 28px 40px',
}

export const signatureText = {
  margin: 0,
  fontSize: '15px',
  lineHeight: '1.7',
  color: BRAND.textBody,
}

// ===== Footer =====
export const footerSection = {
  padding: '20px 40px 26px 40px',
  textAlign: 'center' as const,
  backgroundColor: BRAND.surfaceMuted,
}

export const footerText = {
  margin: 0,
  fontSize: '11px',
  lineHeight: '1.65',
  color: BRAND.textFooter,
}

export const footerLink = {
  color: BRAND.primary,
  textDecoration: 'none',
  fontWeight: 700,
}
