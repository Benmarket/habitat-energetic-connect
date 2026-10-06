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
    className={cn(
      "relative w-full overflow-hidden border-y border-border/50 bg-muted/40 py-3.5",
      className
    )}
  >
    {/* Texture discrète qui meuble la largeur sans texte ni image ajoutés */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-30"
      style={{
        backgroundImage:
          "radial-gradient(hsl(var(--border)) 0.5px, transparent 0.5px)",
        backgroundSize: "22px 22px",
        maskImage:
          "linear-gradient(to right, black, transparent 32%, transparent 68%, black)",
        WebkitMaskImage:
          "linear-gradient(to right, black, transparent 32%, transparent 68%, black)",
      }}
    />
    <div className="relative mx-auto flex w-full max-w-6xl items-center gap-6 px-4">
      <span
        aria-hidden="true"
        className="min-w-0 flex-1 bg-gradient-to-r from-transparent to-border/50 border-t"
      />
      <a
        href="https://france-renov.gouv.fr/servicepublic"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full max-w-[340px] shrink-0 rounded-md border border-border/60 bg-background p-1.5 shadow-soft transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <img
          src={BANDEAU_SRC}
          alt={FRANCE_RENOV_MESSAGE}
          width={1600}
          height={342}
          loading="lazy"
          className="block h-auto w-full rounded-[3px]"
        />
      </a>
      <span
        aria-hidden="true"
        className="min-w-0 flex-1 bg-gradient-to-l from-transparent to-border/50 border-t"
      />
    </div>
  </aside>
);

export default FranceRenovBanner;
