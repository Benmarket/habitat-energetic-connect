import { CheckCircle2, Star } from "lucide-react";

interface SolarComparatifProps {
  onCtaClick?: () => void;
}

const puissances = [
  {
    kwc: "3 kWc",
    panneaux: "6-8 panneaux",
    surface: "~16 m²",
    production: "3 300 kWh/an",
    economie: "50-60€/mois",
    ideal: "Couple / petit foyer",
    prix: "7 000 – 9 000 €",
    prixAide: "~5 500 €",
    popular: false,
  },
  {
    kwc: "6 kWc",
    panneaux: "12-16 panneaux",
    surface: "~32 m²",
    production: "6 600 kWh/an",
    economie: "90-120€/mois",
    ideal: "Famille 3-4 pers.",
    prix: "11 000 – 14 000 €",
    prixAide: "~9 000 €",
    popular: true,
  },
  {
    kwc: "9 kWc",
    panneaux: "18-24 panneaux",
    surface: "~48 m²",
    production: "9 900 kWh/an",
    economie: "130-170€/mois",
    ideal: "Grande maison / piscine",
    prix: "15 000 – 20 000 €",
    prixAide: "~12 500 €",
    popular: false,
  },
];

const SolarComparatif = ({ onCtaClick }: SolarComparatifProps) => {
  return (
    <section className="py-12 lg:py-20 bg-muted/50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10 lg:mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            📊 Comparatif
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold">
            Quelle puissance pour <span className="text-primary">votre maison ?</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Trouvez l'installation adaptée à vos besoins et votre budget.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {puissances.map((p, i) => (
            <div
              key={i}
              className={`relative bg-card rounded-2xl border-2 p-6 lg:p-8 flex flex-col transition-all hover:shadow-xl ${
                p.popular
                  ? "border-primary shadow-lg scale-[1.02] lg:scale-105"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-bold rounded-full flex items-center gap-1 shadow-lg">
                  <Star className="w-4 h-4 fill-current" /> Le plus populaire
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-3xl font-black text-primary">{p.kwc}</h3>
                <p className="text-muted-foreground text-sm mt-1">{p.panneaux}</p>
              </div>

              <div className="space-y-3 flex-1">
                <Row label="Surface toiture" value={p.surface} />
                <Row label="Production annuelle" value={p.production} />
                <Row label="Économie mensuelle" value={p.economie} highlight />
                <Row label="Idéal pour" value={p.ideal} />
                <div className="border-t border-border pt-3 mt-3">
                  <Row label="Prix avant aides" value={p.prix} />
                  <Row label="Prix après aides*" value={p.prixAide} highlight />
                </div>
              </div>

              <button
                onClick={onCtaClick}
                className={`mt-6 w-full py-3 rounded-xl font-bold transition-all ${
                  p.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}
              >
                Demander un devis gratuit
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          * Prix estimés après déduction de la prime autoconsommation. Montants indicatifs, devis personnalisé sur demande.
        </p>
      </div>
    </section>
  );
};

const Row = ({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
      <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
      {label}
    </span>
    <span className={`text-sm font-semibold text-right ${highlight ? "text-primary" : "text-foreground"}`}>{value}</span>
  </div>
);

export default SolarComparatif;
