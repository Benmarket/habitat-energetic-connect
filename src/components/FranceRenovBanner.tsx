import { cn } from "@/lib/utils";

const BANDEAU_SRC = "/bandeau-france-renov.webp";

/**
 * Bandeau d'information France Rénov' obligatoire (arrêté du 7 juillet 2026,
 * art. L.122-26 code de la consommation). Visuel officiel, non modifiable,
 * non masquable, cliquable vers le service public.
 * Intégration : bande pleine largeur, propre, sans habillage ajouté.
 */
export const FRANCE_RENOV_MESSAGE =
  "Avant de vous engager, le service public vous informe gratuitement pour préparer et sécuriser votre projet : france-renov.gouv.fr";

const FranceRenovBanner = ({ className }: { className?: string }) => (
  <aside
    aria-label="Information du service public France Rénov'"
    data-france-renov-banner
    className={cn(
      "w-full border-y border-border/40 bg-muted/30",
      className
    )}
  >
    <a
      href="https://france-renov.gouv.fr/servicepublic"
      target="_blank"
      rel="noopener noreferrer"
      className="mx-auto block w-full max-w-7xl px-4 py-3 sm:px-6 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <img
        src={BANDEAU_SRC}
        alt={FRANCE_RENOV_MESSAGE}
        width={1600}
        height={342}
        loading="lazy"
        className="mx-auto block h-auto w-full max-w-[420px]"
      />
    </a>
  </aside>
);

export default FranceRenovBanner;
