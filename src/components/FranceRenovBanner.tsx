import bandeau from "@/assets/bandeau-france-renov.webp.asset.json";
import { cn } from "@/lib/utils";

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
    className={cn("w-full bg-background py-4 md:py-6", className)}
  >
    <div className="mx-auto w-full md:max-w-[760px] md:px-4">
      <a
        href="https://france-renov.gouv.fr/servicepublic"
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <img
          src={bandeau.url}
          alt={FRANCE_RENOV_MESSAGE}
          width={1600}
          height={342}
          className="block h-auto w-full md:min-h-[150px] md:object-contain"
        />
      </a>
    </div>
  </aside>
);

export default FranceRenovBanner;
