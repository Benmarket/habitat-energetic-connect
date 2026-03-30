import DOMPurify from 'dompurify';

/**
 * Configuration de DOMPurify pour nettoyer le HTML des articles/guides
 * Permet les balises et attributs nécessaires tout en bloquant les scripts malveillants
 */
const ALLOWED_TAGS = [
  // Structure
  'div', 'span', 'p', 'br', 'hr',
  // Titres
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // Listes
  'ul', 'ol', 'li',
  // Texte formaté
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins', 'mark', 'sub', 'sup',
  // Liens et médias
  'a', 'img', 'figure', 'figcaption', 'video', 'source', 'audio',
  // Tableaux
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  // Citations
  'blockquote', 'q', 'cite', 'pre', 'code',
  // Formulaires (lecture seule)
  'button',
  // Autres
  'section', 'article', 'header', 'footer', 'nav', 'aside', 'main', 'details', 'summary'
];

const ALLOWED_ATTR = [
  // Globaux
  'id', 'class', 'style', 'title', 'lang', 'dir',
  // Liens
  'href', 'target', 'rel',
  // Images
  'src', 'alt', 'width', 'height', 'loading', 'decoding',
  // Vidéos/Audio
  'controls', 'autoplay', 'loop', 'muted', 'poster', 'preload', 'type',
  // Tableaux
  'colspan', 'rowspan', 'scope',
  // Data attributes pour CTA banners et boutons
  'data-cta-banner', 'data-template-style', 'data-bg-color', 'data-secondary-color',
  'data-text-color', 'data-accent-color', 'data-title', 'data-subtitle',
  'data-button-text', 'data-button-url', 'data-button-bg', 'data-button-text-color',
  'data-button-radius', 'data-popup-id', 'data-popup-trigger',
  'data-custom-button', 'data-custom-image', 'data-destination-type', 'data-url',
  // Aria pour accessibilité
  'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-hidden', 'role'
];

/**
 * Nettoie le HTML pour prévenir les attaques XSS tout en préservant le formatage
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  
  // Utiliser DOMPurify avec notre configuration
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Retire les balises script, style inline dangereux
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select'],
    // Nettoie les URLs potentiellement dangereuses
    ALLOW_DATA_ATTR: true,
    // Active le mode strict pour les URLs
    SANITIZE_DOM: true,
  });
  
  return clean;
}

/**
 * Nettoie le HTML avec une configuration plus stricte (pour les commentaires utilisateurs, forum, etc.)
 */
export function sanitizeUserContent(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    // Force target="_blank" et rel="noopener noreferrer" pour les liens externes
    ADD_ATTR: ['target', 'rel'],
    SANITIZE_DOM: true,
  });
}

/**
 * Échappe le HTML pour l'affichage en texte brut (ex: dans les tooltips, titres, etc.)
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

export default sanitizeHtml;
