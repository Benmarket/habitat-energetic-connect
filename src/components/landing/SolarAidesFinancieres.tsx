import { Euro, TrendingDown, BadgePercent, Landmark } from "lucide-react";
import solarSavingsImg from "@/assets/landing/solar-savings-couple.jpg";

interface SolarAidesFinancieresProps {
  region?: string;
  onCtaClick?: () => void;
}

const aidesData = {
  france: {
    title: "Les aides financières pour votre installation solaire",
    subtitle: "Cumulez les aides et réduisez jusqu'à 50% le coût de votre installation.",
    primeAutoconsoTitle: "Prime à l'autoconsommation (2025)",
    rows: [
      { puissance: "≤ 3 kWc", prime: "350 €/kWc", total: "~1 050 €", rachat: "0,1313 €/kWh" },
      { puissance: "3 – 9 kWc", prime: "260 €/kWc", total: "~2 340 €", rachat: "0,1313 €/kWh" },
      { puissance: "9 – 36 kWc", prime: "200 €/kWc", total: "~7 200 €", rachat: "0,0788 €/kWh" },
      { puissance: "36 – 100 kWc", prime: "100 €/kWc", total: "~10 000 €", rachat: "0,0788 €/kWh" },
    ],
    otherAides: [
      { icon: BadgePercent, title: "TVA réduite à 10%", desc: "Pour les installations ≤ 3 kWc raccordées au réseau." },
      { icon: Landmark, title: "Éco-PTZ", desc: "Prêt à taux zéro jusqu'à 15 000 € pour financer vos travaux." },
      { icon: TrendingDown, title: "MaPrimeRénov'", desc: "Aide complémentaire selon vos revenus et votre situation." },
      { icon: Euro, title: "CEE (Certificats d'Économies d'Énergie)", desc: "Bonus versé par les fournisseurs d'énergie." },
    ],
  },
  martinique: {
    title: "Aides financières solaires en Martinique",
    subtitle: "Profitez d'aides renforcées pour les DOM-TOM et réduisez considérablement votre investissement.",
    primeAutoconsoTitle: "Prime à l'autoconsommation DOM-TOM (2025)",
    rows: [
      { puissance: "≤ 3 kWc", prime: "500 €/kWc", total: "~1 500 €", rachat: "0,1313 €/kWh" },
      { puissance: "3 – 9 kWc", prime: "370 €/kWc", total: "~3 330 €", rachat: "0,1313 €/kWh" },
      { puissance: "9 – 36 kWc", prime: "210 €/kWc", total: "~7 560 €", rachat: "0,0788 €/kWh" },
      { puissance: "36 – 100 kWc", prime: "110 €/kWc", total: "~11 000 €", rachat: "0,0788 €/kWh" },
    ],
    otherAides: [
      { icon: BadgePercent, title: "TVA réduite à 8,5%", desc: "Taux préférentiel applicable en Martinique pour le solaire." },
      { icon: Landmark, title: "Éco-PTZ Outre-mer", desc: "Prêt à taux zéro jusqu'à 15 000 € pour vos travaux." },
      { icon: TrendingDown, title: "Aide CTM", desc: "Aide du Conseil Territorial de la Martinique pour la transition énergétique." },
      { icon: Euro, title: "CEE majorés DOM", desc: "Bonus CEE renforcés pour les départements d'outre-mer." },
    ],
  },
  guadeloupe: {
    title: "Aides financières solaires en Guadeloupe",
    subtitle: "Des dispositifs renforcés pour l'outre-mer, cumulables pour un investissement minimal.",
    primeAutoconsoTitle: "Prime à l'autoconsommation DOM-TOM (2025)",
    rows: [
      { puissance: "≤ 3 kWc", prime: "500 €/kWc", total: "~1 500 €", rachat: "0,1313 €/kWh" },
      { puissance: "3 – 9 kWc", prime: "370 €/kWc", total: "~3 330 €", rachat: "0,1313 €/kWh" },
      { puissance: "9 – 36 kWc", prime: "210 €/kWc", total: "~7 560 €", rachat: "0,0788 €/kWh" },
      { puissance: "36 – 100 kWc", prime: "110 €/kWc", total: "~11 000 €", rachat: "0,0788 €/kWh" },
    ],
    otherAides: [
      { icon: BadgePercent, title: "TVA réduite à 8,5%", desc: "Taux spécial Guadeloupe pour les installations solaires." },
      { icon: Landmark, title: "Éco-PTZ Outre-mer", desc: "Prêt à taux zéro jusqu'à 15 000 €." },
      { icon: TrendingDown, title: "Aide Région Guadeloupe", desc: "Subventions du Conseil Régional pour la transition solaire." },
      { icon: Euro, title: "CEE majorés DOM", desc: "Primes CEE bonifiées pour les DOM-TOM." },
    ],
  },
  guyane: {
    title: "Aides financières solaires en Guyane",
    subtitle: "La Guyane bénéficie d'aides renforcées pour accélérer la transition énergétique.",
    primeAutoconsoTitle: "Prime à l'autoconsommation DOM-TOM (2025)",
    rows: [
      { puissance: "≤ 3 kWc", prime: "500 €/kWc", total: "~1 500 €", rachat: "0,1313 €/kWh" },
      { puissance: "3 – 9 kWc", prime: "370 €/kWc", total: "~3 330 €", rachat: "0,1313 €/kWh" },
      { puissance: "9 – 36 kWc", prime: "210 €/kWc", total: "~7 560 €", rachat: "0,0788 €/kWh" },
      { puissance: "36 – 100 kWc", prime: "110 €/kWc", total: "~11 000 €", rachat: "0,0788 €/kWh" },
    ],
    otherAides: [
      { icon: BadgePercent, title: "TVA réduite à 8,5%", desc: "Taux DOM applicable aux installations photovoltaïques." },
      { icon: Landmark, title: "Éco-PTZ Outre-mer", desc: "Prêt à taux zéro jusqu'à 15 000 €." },
      { icon: TrendingDown, title: "Aide CTG", desc: "Soutien de la Collectivité Territoriale de Guyane." },
      { icon: Euro, title: "CEE majorés DOM", desc: "Certificats d'économie d'énergie bonifiés outre-mer." },
    ],
  },
  corse: {
    title: "Aides financières solaires en Corse",
    subtitle: "La Corse bénéficie d'aides spécifiques grâce au Plan Énergétique de la Collectivité.",
    primeAutoconsoTitle: "Prime à l'autoconsommation (2025)",
    rows: [
      { puissance: "≤ 3 kWc", prime: "350 €/kWc", total: "~1 050 €", rachat: "0,1313 €/kWh" },
      { puissance: "3 – 9 kWc", prime: "260 €/kWc", total: "~2 340 €", rachat: "0,1313 €/kWh" },
      { puissance: "9 – 36 kWc", prime: "200 €/kWc", total: "~7 200 €", rachat: "0,0788 €/kWh" },
      { puissance: "36 – 100 kWc", prime: "100 €/kWc", total: "~10 000 €", rachat: "0,0788 €/kWh" },
    ],
    otherAides: [
      { icon: BadgePercent, title: "TVA à 10%", desc: "Pour les installations ≤ 3 kWc raccordées au réseau." },
      { icon: Landmark, title: "Éco-PTZ", desc: "Prêt à taux zéro jusqu'à 15 000 €." },
      { icon: TrendingDown, title: "Aide Collectivité de Corse", desc: "Aides complémentaires de la CdC pour la transition énergétique insulaire." },
      { icon: Euro, title: "CEE + ADEME Corse", desc: "Dispositifs CEE et accompagnement ADEME Corse." },
    ],
  },
  reunion: {
    title: "Aides financières solaires à La Réunion",
    subtitle: "L'île de La Réunion bénéficie d'aides majorées pour maximiser votre investissement solaire.",
    primeAutoconsoTitle: "Prime à l'autoconsommation DOM-TOM (2025)",
    rows: [
      { puissance: "≤ 3 kWc", prime: "500 €/kWc", total: "~1 500 €", rachat: "0,1313 €/kWh" },
      { puissance: "3 – 9 kWc", prime: "370 €/kWc", total: "~3 330 €", rachat: "0,1313 €/kWh" },
      { puissance: "9 – 36 kWc", prime: "210 €/kWc", total: "~7 560 €", rachat: "0,0788 €/kWh" },
      { puissance: "36 – 100 kWc", prime: "110 €/kWc", total: "~11 000 €", rachat: "0,0788 €/kWh" },
    ],
    otherAides: [
      { icon: BadgePercent, title: "TVA réduite à 8,5%", desc: "Taux préférentiel DOM pour les installations solaires." },
      { icon: Landmark, title: "Éco-PTZ Outre-mer", desc: "Prêt à taux zéro jusqu'à 15 000 €." },
      { icon: TrendingDown, title: "Aide Région Réunion", desc: "Subventions du Conseil Régional pour le photovoltaïque." },
      { icon: Euro, title: "CEE majorés DOM", desc: "Primes CEE renforcées en zone non-interconnectée." },
    ],
  },
};

const SolarAidesFinancieres = ({ region = "france", onCtaClick }: SolarAidesFinancieresProps) => {
  const data = aidesData[region as keyof typeof aidesData] || aidesData.france;

  return (
    <section className="py-12 lg:py-20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-10 lg:mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold mb-4">
            💰 Aides & Subventions
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold">
            {data.title}
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">{data.subtitle}</p>
        </div>

        {/* Visual: couple reviewing savings */}
        <div className="rounded-2xl overflow-hidden shadow-lg mb-10 grid lg:grid-cols-[1fr_1fr] gap-0">
          <img src={solarSavingsImg} alt="Couple constatant ses économies d'énergie" className="w-full h-52 lg:h-64 object-cover" loading="lazy" width={800} height={256} />
          <div className="bg-primary/10 flex flex-col items-center justify-center p-8 text-center">
            <span className="text-4xl lg:text-5xl font-black text-primary">Jusqu'à -50%</span>
            <span className="text-muted-foreground mt-2 text-sm">sur le coût de votre installation grâce aux aides cumulées</span>
          </div>
        </div>

        {/* Tableau des primes */}
        <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden mb-10">
          <div className="bg-primary/10 px-6 py-4 border-b border-border">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Euro className="w-5 h-5 text-primary" />
              {data.primeAutoconsoTitle}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-3 text-left font-bold text-foreground">Puissance</th>
                  <th className="px-6 py-3 text-left font-bold text-foreground">Prime / kWc</th>
                  <th className="px-6 py-3 text-left font-bold text-foreground">Total estimé</th>
                  <th className="px-6 py-3 text-left font-bold text-foreground">Tarif rachat surplus</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i} className={`border-b border-border/50 ${i === 1 ? "bg-primary/5" : ""}`}>
                    <td className="px-6 py-4 font-semibold">{row.puissance}</td>
                    <td className="px-6 py-4 text-primary font-bold">{row.prime}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{row.total}</td>
                    <td className="px-6 py-4 text-muted-foreground">{row.rachat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-muted/30 text-xs text-muted-foreground">
            * Montants indicatifs susceptibles d'évoluer. Source : arrêté tarifaire en vigueur.
          </div>
        </div>

        {/* Autres aides */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {data.otherAides.map((aide, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:border-primary/30 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <aide.icon className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-bold text-foreground mb-1">{aide.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{aide.desc}</p>
            </div>
          ))}
        </div>

        {onCtaClick && (
          <div className="flex justify-center mt-10">
            <button
              onClick={onCtaClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 py-3 rounded-full shadow-xl transition-all hover:shadow-2xl hover:scale-105"
            >
              Calculer mes aides →
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default SolarAidesFinancieres;
