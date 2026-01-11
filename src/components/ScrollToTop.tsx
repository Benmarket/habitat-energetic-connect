import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Composant qui gère le scroll sur changement de route.
 * - Sans hash: remonte en haut
 * - Avec hash (#section): scrolle vers l'élément correspondant
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Si on a une ancre, on scrolle vers l'élément après rendu
    if (hash) {
      const id = decodeURIComponent(hash.replace(/^#/, ""));

      // Fonction pour tenter le scroll vers l'élément
      const scrollToElement = (attempt = 0) => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (attempt < 10) {
          // L'élément n'existe pas encore, on réessaie après un court délai
          // (max 10 tentatives = ~1 seconde)
          setTimeout(() => scrollToElement(attempt + 1), 100);
        }
      };

      // Attendre que le DOM soit mis à jour avant de chercher l'élément
      requestAnimationFrame(() => {
        setTimeout(scrollToElement, 100);
      });

      return;
    }

    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};
