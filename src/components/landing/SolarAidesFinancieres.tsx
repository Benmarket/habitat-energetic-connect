import { Euro, TrendingDown, BadgePercent, Landmark } from "lucide-react";
import solarSavingsImg from "@/assets/landing/solar-savings-couple.jpg";
import { useScrollReveal, revealClass } from "@/hooks/useScrollReveal";

interface SolarAidesFinancieresProps {
  region?: string;
  onCtaClick?: () => void;
}

const aidesData = {
  france: {
    title: "Les aides financières pour votre installation solaire",
    subtitle: "Les dispositifs éventuels dépendent de votre territoire, de votre installation et de votre éligibilité.",
    primeAutoconsoTitle: "Prime et rachat : conditions territoriales",
    rows: [
      { puissance: "≤ 3 kWc", prime: "Métropole : supprimée*", total: "Corse / DOM : variable*", rachat: "Selon contrat territorial" },
      { puissance: "3 – 9 kWc", prime: "Métropole : supprimée*", total: "Corse / DOM : variable*", rachat: "Selon contrat territorial" },
      { puissance: "9 – 36 kWc", prime: "Métropole : supprimée*", total: "Corse / DOM : variable*", rachat: "Selon contrat territorial" },
      { puissance: "36 – 100 kWc", prime: "Métropole : supprimée*", total: "Corse / DOM : variable*", rachat: "Selon contrat territorial" },
    ],
    otherAides: [
      { icon: BadgePercent, title: "TVA sous conditions", desc: "Un taux de 5,5 % pourrait s’appliquer jusqu’à 9 kWc avec du matériel et un pilotage éligibles." },
      { icon: Landmark, title: "Financement à vérifier", desc: "L’éco-PTZ ne finance pas automatiquement le photovoltaïque seul ; vérifiez les travaux éligibles." },
      { icon: TrendingDown, title: "Photovoltaïque seul", desc: "MaPrimeRénov’ ne finance pas le photovoltaïque seul ; le solaire thermique relève d’autres règles." },
      { icon: Euro, title: "CEE : travaux éligibles", desc: "Les CEE ne sont pas une aide automatique au photovoltaïque seul ; distinguez les travaux de rénovation." },
    ],
  },
  martinique: {
    title: "Aides financières solaires en Martinique",
    subtitle: "Les dispositifs éventuels dépendent de votre territoire, de votre installation et de votre éligibilité.",
    primeAutoconsoTitle: "Prime et rachat : conditions territoriales",
    rows: [
      { puissance: "≤ 3 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
      { puissance: "3 – 9 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
      { puissance: "9 – 36 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
      { puissance: "36 – 100 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
    ],
    otherAides: [
      { icon: BadgePercent, title: "TVA selon conditions", desc: "Le taux applicable dépend du territoire, du matériel et de la prestation ; vérifiez le devis." },
      { icon: Landmark, title: "Financement à vérifier", desc: "L’éco-PTZ ne finance pas automatiquement le photovoltaïque seul ; vérifiez les travaux éligibles." },
      { icon: TrendingDown, title: "Aide CTM", desc: "Aide du Conseil Territorial de la Martinique pour la transition énergétique." },
      { icon: Euro, title: "CEE : travaux éligibles", desc: "Les CEE ne sont pas une aide automatique au photovoltaïque seul ; distinguez les travaux de rénovation." },
    ],
  },
  guadeloupe: {
    title: "Aides financières solaires en Guadeloupe",
    subtitle: "Les dispositifs éventuels dépendent de votre territoire, de votre installation et de votre éligibilité.",
    primeAutoconsoTitle: "Prime et rachat : conditions territoriales",
    rows: [
      { puissance: "≤ 3 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
      { puissance: "3 – 9 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
      { puissance: "9 – 36 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
      { puissance: "36 – 100 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
    ],
    otherAides: [
      { icon: BadgePercent, title: "TVA selon conditions", desc: "Le taux applicable dépend du territoire, du matériel et de la prestation ; vérifiez le devis." },
      { icon: Landmark, title: "Financement à vérifier", desc: "L’éco-PTZ ne finance pas automatiquement le photovoltaïque seul ; vérifiez les travaux éligibles." },
      { icon: TrendingDown, title: "Aide Région Guadeloupe", desc: "Subventions du Conseil Régional pour la transition solaire." },
      { icon: Euro, title: "CEE : travaux éligibles", desc: "Les CEE ne sont pas une aide automatique au photovoltaïque seul ; distinguez les travaux de rénovation." },
    ],
  },
  guyane: {
    title: "Aides financières solaires en Guyane",
    subtitle: "Les dispositifs éventuels dépendent de votre territoire, de votre installation et de votre éligibilité.",
    primeAutoconsoTitle: "Prime et rachat : conditions territoriales",
    rows: [
      { puissance: "≤ 3 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
      { puissance: "3 – 9 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
      { puissance: "9 – 36 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
      { puissance: "36 – 100 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
    ],
    otherAides: [
      { icon: BadgePercent, title: "Pas de TVA en Guyane", desc: "La TVA ne s’applique pas en Guyane (article 294 du CGI)." },
      { icon: Landmark, title: "Financement à vérifier", desc: "L’éco-PTZ ne finance pas automatiquement le photovoltaïque seul ; vérifiez les travaux éligibles." },
      { icon: TrendingDown, title: "Aide CTG", desc: "Soutien de la Collectivité Territoriale de Guyane." },
      { icon: Euro, title: "CEE : travaux éligibles", desc: "Les CEE ne sont pas une aide automatique au photovoltaïque seul ; distinguez les travaux de rénovation." },
    ],
  },
  corse: {
    title: "Aides financières solaires en Corse",
    subtitle: "Les dispositifs éventuels dépendent de votre territoire, de votre installation et de votre éligibilité.",
    primeAutoconsoTitle: "Prime et rachat : conditions territoriales",
    rows: [
      { puissance: "≤ 3 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
      { puissance: "3 – 9 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
      { puissance: "9 – 36 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
      { puissance: "36 – 100 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
    ],
    otherAides: [
      { icon: BadgePercent, title: "TVA selon conditions", desc: "Le taux applicable dépend du territoire, du matériel et de la prestation ; vérifiez le devis." },
      { icon: Landmark, title: "Financement à vérifier", desc: "L’éco-PTZ ne finance pas automatiquement le photovoltaïque seul ; vérifiez les travaux éligibles." },
      { icon: TrendingDown, title: "Aide Collectivité de Corse", desc: "Aides complémentaires de la CdC pour la transition énergétique insulaire." },
      { icon: Euro, title: "CEE : travaux éligibles", desc: "Les CEE ne sont pas une aide automatique au photovoltaïque seul ; distinguez les travaux de rénovation." },
    ],
  },
  reunion: {
    title: "Aides financières solaires à La Réunion",
    subtitle: "Les dispositifs éventuels dépendent de votre territoire, de votre installation et de votre éligibilité.",
    primeAutoconsoTitle: "Prime et rachat : conditions territoriales",
    rows: [
      { puissance: "≤ 3 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
      { puissance: "3 – 9 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
      { puissance: "9 – 36 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
      { puissance: "36 – 100 kWc", prime: "Selon dispositif", total: "Selon éligibilité", rachat: "Selon contrat territorial" },
    ],
    otherAides: [
      { icon: BadgePercent, title: "TVA selon conditions", desc: "Le taux applicable dépend du territoire, du matériel et de la prestation ; vérifiez le devis." },
      { icon: Landmark, title: "Financement à vérifier", desc: "L’éco-PTZ ne finance pas automatiquement le photovoltaïque seul ; vérifiez les travaux éligibles." },
      { icon: TrendingDown, title: "Aide Région Réunion", desc: "Subventions du Conseil Régional pour le photovoltaïque." },
      { icon: Euro, title: "CEE : travaux éligibles", desc: "Les CEE ne sont pas une aide automatique au photovoltaïque seul ; distinguez les travaux de rénovation." },
    ],
  },
};

const SolarAidesFinancieres = ({ region = "france", onCtaClick }: SolarAidesFinancieresProps) => {
  const data = aidesData[region as keyof typeof aidesData] || aidesData.france;

  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-12 lg:py-20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <div ref={ref} className="container mx-auto px-4 max-w-6xl">
        <div className={`text-center mb-10 lg:mb-14 ${revealClass(isVisible).className}`}>
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold mb-4">
            💰 Aides & Subventions
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold">
            {data.title}
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">{data.subtitle}</p>
        </div>

        {/* Visual: couple reviewing savings */}
        <div className={`rounded-2xl overflow-hidden shadow-lg mb-10 grid lg:grid-cols-[1fr_1fr] gap-0 ${revealClass(isVisible, 150).className}`} style={revealClass(isVisible, 150).style}>
          <img src={solarSavingsImg} alt="Couple constatant ses économies d'énergie" className="w-full h-52 lg:h-64 object-cover" loading="lazy" width={800} height={256} />
          <div className="bg-primary/10 flex flex-col items-center justify-center p-8 text-center">
            <span className="text-4xl lg:text-5xl font-black text-primary">Selon votre projet</span>
            <span className="text-muted-foreground mt-2 text-sm">aides éventuelles à vérifier avant tout engagement</span>
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
                  <th className="px-6 py-3 text-left font-bold text-foreground">Prime éventuelle</th>
                  <th className="px-6 py-3 text-left font-bold text-foreground">Conditions territoriales</th>
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
            * En métropole, la prime à l'autoconsommation est supprimée pour les nouvelles demandes concernées depuis le 5 juin 2026. En Corse et en Outre-mer, vérifiez le barème applicable au territoire, à la puissance et à la date de demande. MaPrimeRénov' ne finance pas le photovoltaïque seul.
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
