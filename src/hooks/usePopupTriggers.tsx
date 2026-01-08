import { useEffect } from 'react';

/**
 * Hook qui écoute les clics sur les éléments avec data-popup-trigger
 * et déclenche l'ouverture du popup correspondant
 */
export function usePopupTriggers(containerRef?: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const popupTrigger = target.closest('[data-popup-trigger]');
      
      if (popupTrigger) {
        const popupId = popupTrigger.getAttribute('data-popup-trigger');
        if (popupId) {
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('open-popup', { 
            detail: { popupId } 
          }));
        }
      }
    };

    // Écouter soit sur le container spécifié, soit sur tout le document
    const container = containerRef?.current || document;
    container.addEventListener('click', handleClick as EventListener);

    return () => {
      container.removeEventListener('click', handleClick as EventListener);
    };
  }, [containerRef]);
}
