import { cn } from "@/lib/utils";

const BANDEAU_SRC = "/bandeau-france-renov.webp";

/**
 * Bandeau d'information France Rénov' obligatoire (arrêté du 7 juillet 2026,
 * art. L.122-26 code de la consommation). Visuel officiel extrait de la charte,
 * non modifiable, non masquable, cliquable vers le service public.
 */
export const FRANCE_RENOV_MESSAGE =
  "Avant de vous engager, le service public vous informe gratuitement pour préparer et sécuriser votre projet : france-renov.gouv.fr";

const FranceRenovBanner = ({ className }: { className?: string }) => (
  <aside
    aria-label="Information du service public France Rénov'"
    data-france-renov-banner
    className={cn("w-full bg-background py-2 md:py-3", className)}
  >
    <div className="mx-auto w-full md:max-w-[600px] md:px-4">
      <a
        href="https://france-renov.gouv.fr/servicepublic"
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <img
          src={BANDEAU_SRC}
          alt={FRANCE_RENOV_MESSAGE}
          width={1600}
          height={342}
          className="block h-auto w-full opacity-90 transition-opacity hover:opacity-100 md:max-h-[96px] md:object-contain"
        />
      </a>
    </div>
  </aside>
);

export default FranceRenovBanner;
