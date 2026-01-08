import React from 'react';

interface CtaBannerAttributes {
  bannerId: string;
  templateStyle: string;
  backgroundColor: string;
  secondaryColor: string;
  textColor: string;
  accentColor: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonUrl: string;
  buttonBackground: string;
  buttonTextColor: string;
  buttonBorderRadius: number;
  popupId: string | null;
}

interface CtaBannerProps {
  attrs: CtaBannerAttributes;
}

/**
 * Composant de rendu pour un bandeau CTA côté front-end
 */
const CtaBannerComponent: React.FC<CtaBannerProps> = ({ attrs }) => {
  const getBackgroundStyle = (): React.CSSProperties => {
    const bgColor = attrs.backgroundColor || '#10b981';
    const secondaryColor = attrs.secondaryColor || '#059669';
    const accentColor = attrs.accentColor || '#34d399';

    switch (attrs.templateStyle) {
      case 'wave':
        return {
          background: `linear-gradient(135deg, ${bgColor} 0%, ${secondaryColor} 100%)`,
        };
      case 'geometric':
        return {
          background: bgColor,
          backgroundImage: `linear-gradient(45deg, ${secondaryColor} 25%, transparent 25%), 
                            linear-gradient(-45deg, ${secondaryColor} 25%, transparent 25%)`,
          backgroundSize: '20px 20px',
        };
      case 'gradient':
        return {
          background: `linear-gradient(90deg, ${bgColor} 0%, ${secondaryColor} 50%, ${accentColor} 100%)`,
        };
      case 'minimal':
        return {
          background: bgColor,
          borderLeft: `4px solid ${accentColor}`,
        };
      default:
        return { background: bgColor };
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (attrs.popupId) {
      e.preventDefault();
      // Déclencher l'ouverture du popup via un événement personnalisé
      window.dispatchEvent(new CustomEvent('open-popup', { detail: { popupId: attrs.popupId } }));
    }
  };

  return (
    <div
      className="cta-banner-rendered my-8"
      style={{
        ...getBackgroundStyle(),
        borderRadius: '12px',
        overflow: 'hidden',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h3
        style={{
          color: attrs.textColor || '#ffffff',
          fontSize: '1.5rem',
          fontWeight: 700,
          margin: 0,
          marginBottom: attrs.subtitle ? '0.5rem' : '1rem',
        }}
      >
        {attrs.title}
      </h3>
      {attrs.subtitle && (
        <p
          style={{
            color: attrs.textColor || '#ffffff',
            opacity: 0.9,
            margin: 0,
            marginBottom: '1rem',
          }}
        >
          {attrs.subtitle}
        </p>
      )}
      <a
        href={attrs.popupId ? '#' : attrs.buttonUrl}
        onClick={handleClick}
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          background: attrs.buttonBackground || '#ffffff',
          color: attrs.buttonTextColor || '#10b981',
          borderRadius: `${attrs.buttonBorderRadius || 6}px`,
          textDecoration: 'none',
          fontWeight: 600,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {attrs.buttonText}
      </a>
    </div>
  );
};

/**
 * Parse les attributs d'un élément DOM data-cta-banner
 */
function parseCtaBannerAttributes(element: Element): CtaBannerAttributes {
  return {
    bannerId: element.getAttribute('data-cta-banner') || '',
    templateStyle: element.getAttribute('data-template-style') || 'wave',
    backgroundColor: element.getAttribute('data-bg-color') || '#10b981',
    secondaryColor: element.getAttribute('data-secondary-color') || '#059669',
    textColor: element.getAttribute('data-text-color') || '#ffffff',
    accentColor: element.getAttribute('data-accent-color') || '#34d399',
    title: element.getAttribute('data-title') || 'Titre',
    subtitle: element.getAttribute('data-subtitle') || '',
    buttonText: element.getAttribute('data-button-text') || 'En savoir plus',
    buttonUrl: element.getAttribute('data-button-url') || '#contact',
    buttonBackground: element.getAttribute('data-button-bg') || '#ffffff',
    buttonTextColor: element.getAttribute('data-button-text-color') || '#10b981',
    buttonBorderRadius: parseInt(element.getAttribute('data-button-radius') || '6', 10),
    popupId: element.getAttribute('data-popup-id') || null,
  };
}

/**
 * Transforme les boutons personnalisés pour qu'ils fonctionnent correctement (popups, ancres, etc.)
 */
function transformCustomButtons(doc: Document): void {
  const buttons = doc.querySelectorAll('div[data-custom-button]');
  
  buttons.forEach((buttonWrapper) => {
    const anchor = buttonWrapper.querySelector('a');
    if (!anchor) return;
    
    const destinationType = buttonWrapper.getAttribute('data-destination-type') || anchor.getAttribute('data-destination-type');
    const popupId = buttonWrapper.getAttribute('data-popup-id') || anchor.getAttribute('data-popup-id');
    const url = buttonWrapper.getAttribute('data-url') || anchor.getAttribute('href') || '#';
    
    // Si c'est un popup, ajouter data-popup-trigger et modifier le href
    if (destinationType === 'popup' && popupId) {
      anchor.setAttribute('data-popup-trigger', popupId);
      anchor.setAttribute('href', '#');
      anchor.removeAttribute('target');
      anchor.removeAttribute('rel');
    }
    // Si c'est un lien externe
    else if (destinationType === 'external') {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    }
    // Si c'est une ancre
    else if (destinationType === 'anchor' && url.startsWith('#')) {
      anchor.setAttribute('href', url);
    }
    // Si c'est un lien interne
    else if (destinationType === 'internal') {
      anchor.setAttribute('href', url);
    }
  });
}

/**
 * Transforme le HTML en remplaçant les div[data-cta-banner] par des éléments HTML stylés
 * et en transformant les boutons pour qu'ils fonctionnent correctement
 * (version pour dangerouslySetInnerHTML)
 */
export function transformCtaBannersInHtml(html: string): string {
  if (!html || typeof window === 'undefined') return html;
  
  // Créer un DOM temporaire pour parser le HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // Transformer les boutons personnalisés
  transformCustomButtons(doc);
  
  // Trouver tous les bandeaux CTA
  const banners = doc.querySelectorAll('div[data-cta-banner]');
  
  banners.forEach((banner) => {
    const attrs = parseCtaBannerAttributes(banner);
    
    // Générer le style de fond
    let backgroundStyle = '';
    const bgColor = attrs.backgroundColor;
    const secondaryColor = attrs.secondaryColor;
    const accentColor = attrs.accentColor;
    
    switch (attrs.templateStyle) {
      case 'wave':
        backgroundStyle = `background: linear-gradient(135deg, ${bgColor} 0%, ${secondaryColor} 100%);`;
        break;
      case 'geometric':
        backgroundStyle = `background: ${bgColor}; background-image: linear-gradient(45deg, ${secondaryColor} 25%, transparent 25%), linear-gradient(-45deg, ${secondaryColor} 25%, transparent 25%); background-size: 20px 20px;`;
        break;
      case 'gradient':
        backgroundStyle = `background: linear-gradient(90deg, ${bgColor} 0%, ${secondaryColor} 50%, ${accentColor} 100%);`;
        break;
      case 'minimal':
        backgroundStyle = `background: ${bgColor}; border-left: 4px solid ${accentColor};`;
        break;
      default:
        backgroundStyle = `background: ${bgColor};`;
    }
    
    // Créer le nouveau HTML pour le bandeau
    const newBanner = doc.createElement('div');
    newBanner.className = 'cta-banner-rendered my-8';
    newBanner.style.cssText = `${backgroundStyle} border-radius: 12px; overflow: hidden; padding: 2rem; text-align: center;`;
    
    // Titre
    const title = doc.createElement('h3');
    title.style.cssText = `color: ${attrs.textColor}; font-size: 1.5rem; font-weight: 700; margin: 0; margin-bottom: ${attrs.subtitle ? '0.5rem' : '1rem'};`;
    title.textContent = attrs.title;
    newBanner.appendChild(title);
    
    // Sous-titre
    if (attrs.subtitle) {
      const subtitle = doc.createElement('p');
      subtitle.style.cssText = `color: ${attrs.textColor}; opacity: 0.9; margin: 0; margin-bottom: 1rem;`;
      subtitle.textContent = attrs.subtitle;
      newBanner.appendChild(subtitle);
    }
    
    // Bouton
    const button = doc.createElement('a');
    button.href = attrs.popupId ? '#' : attrs.buttonUrl;
    button.style.cssText = `display: inline-block; padding: 0.75rem 1.5rem; background: ${attrs.buttonBackground}; color: ${attrs.buttonTextColor}; border-radius: ${attrs.buttonBorderRadius}px; text-decoration: none; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s;`;
    button.textContent = attrs.buttonText;
    if (attrs.popupId) {
      button.setAttribute('data-popup-trigger', attrs.popupId);
    }
    newBanner.appendChild(button);
    
    // Remplacer l'ancien par le nouveau
    banner.replaceWith(newBanner);
  });
  
  return doc.body.innerHTML;
}

/**
 * Composant React qui rend le contenu HTML avec les bandeaux CTA transformés
 */
interface ContentRendererProps {
  html: string;
  className?: string;
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ html, className = '' }) => {
  const transformedHtml = React.useMemo(() => transformCtaBannersInHtml(html), [html]);
  
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: transformedHtml }}
    />
  );
};

export { CtaBannerComponent };
