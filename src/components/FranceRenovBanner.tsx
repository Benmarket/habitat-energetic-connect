import { cn } from "@/lib/utils";

const BANDEAU_SRC = "/bandeau-france-renov.webp";

/**
 * Bandeau d'information France Rénov' obligatoire (arrêté du 7 juillet 2026,
 * art. L.122-26 code de la consommation). Visuel officiel, non modifiable,
 * non masquable, cliquable vers le service public. Version discrète.
 */
export const FRANCE_RENOV_MESSAGE =
  "Avant de vous engager, le service public vous informe gratuitement pour préparer et sécuriser votre projet : france-renov.gouv.fr";

const FranceRenovBanner = ({ className }: { className?: string }) => (
  <aside
    aria-label="Information du service public France Rénov'"
    data-france-renov-banner
    className={cn("w-full border-y border-border/60 bg-muted/30 py-1.5", className)}
  >
    <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4">
      <span aria-hidden="true" className="min-w-0 flex-1 border-t border-border" />
      <a
        href="https://france-renov.gouv.fr/servicepublic"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full max-w-[300px] shrink-0"
      >
        <img
          src={BANDEAU_SRC}
          alt={FRANCE_RENOV_MESSAGE}
          width={1600}
          height={342}
          loading="lazy"
          className="block h-auto w-full opacity-80 transition-opacity hover:opacity-100"
        />
      </a>
      <span aria-hidden="true" className="min-w-0 flex-1 border-t border-border" />
    </div>
  </aside>
);

export default FranceRenovBanner;
