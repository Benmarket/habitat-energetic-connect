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

      const t = window.setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollTo(0, 0);
        }
      }, 0);

      return () => window.clearTimeout(t);
    }

    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};
