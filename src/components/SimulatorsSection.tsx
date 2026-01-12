import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight,
  Zap,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import classeEnergetiqueImg from "@/assets/simulators/classe-energetique.png";
import maisonSolaireImg from "@/assets/simulators/maison-solaire.png";
import pompeChaleurImg from "@/assets/simulators/pompe-chaleur.png";
import isolationImg from "@/assets/simulators/isolation.png";
import eolienneImg from "@/assets/simulators/eolienne.png";
import simulateurSubventionsImg from "@/assets/simulators/simulateur-subventions.png";

interface Simulator {
  id: string;
  title: string;
  description: string;
  image?: string;
  gradient: string;
  iconBg: string;
  ctaText: string;
  features: string[];
}

const SimulatorsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const simulators: Simulator[] = [
    {
      id: "solaire",
      title: "Économies avec le solaire",
      description: "Projetez vos économies potentielles grâce à l'installation photovoltaïque.",
      image: maisonSolaireImg,
      gradient: "from-orange-500 to-yellow-500",
      iconBg: "bg-orange-50",
      ctaText: "Simuler le solaire",
      features: [
        "Estimation de production annuelle",
        "Calcul des économies sur 25 ans",
        "Aides et subventions disponibles"
      ]
    },
    {
      id: "classe-energetique",
      title: "Classe énergétique",
      description: "Estimez la classe énergétique de votre logement pour connaître vos aides éligibles.",
      image: classeEnergetiqueImg,
      gradient: "from-blue-500 to-cyan-500",
      iconBg: "bg-blue-50",
      ctaText: "Simuler ma classe",
      features: [
        "Diagnostic rapide en 2 minutes",
        "Score DPE estimé de A à G",
        "Recommandations personnalisées"
      ]
    },
    {
      id: "pompe-chaleur",
      title: "Chauffage pompe à chaleur",
      description: "Comparez vos coûts actuels et potentiels avec une PAC adaptée.",
      image: pompeChaleurImg,
      gradient: "from-red-500 to-orange-500",
      iconBg: "bg-red-50",
      ctaText: "Simuler la PAC",
      features: [
        "Comparatif coûts gaz/fioul/PAC",
        "Économies annuelles estimées",
        "Montant des aides MaPrimeRénov'"
      ]
    },
    {
      id: "isolation",
      title: "Isolation thermique",
      description: "Évaluez le gain énergétique et les économies via une meilleure isolation.",
      image: isolationImg,
      gradient: "from-purple-500 to-pink-500",
      iconBg: "bg-purple-50",
      ctaText: "Simuler l'isolation",
      features: [
        "Analyse des déperditions thermiques",
        "Priorité des travaux à réaliser",
        "Budget et retour sur investissement"
      ]
    },
    {
      id: "eolienne",
      title: "Production Éolienne",
      description: "Calculez la production potentielle et le retour sur investissement.",
      image: eolienneImg,
      gradient: "from-teal-500 to-cyan-500",
      iconBg: "bg-teal-50",
      ctaText: "Simuler l'éolien",
      features: [
        "Potentiel éolien de votre zone",
        "Production estimée en kWh/an",
        "Rentabilité sur 20 ans"
      ]
    },
    {
      id: "global",
      title: "Simulateur Subventions",
      description: "Obtenez une vision globale de vos économies multi-solutions.",
      image: simulateurSubventionsImg,
      gradient: "from-indigo-500 to-purple-600",
      iconBg: "bg-indigo-50",
      ctaText: "Lancer le simulateur",
      features: [
        "Toutes les aides en un seul calcul",
        "Cumul MaPrimeRénov' + CEE",
        "Reste à charge personnalisé"
      ]
    }
  ];

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev === 0 ? simulators.length - 1 : prev - 1));
  }, [simulators.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev === simulators.length - 1 ? 0 : prev + 1));
  }, [simulators.length]);

  // Get visible simulators (active + next ones)
  const getVisibleSimulators = () => {
    const visible = [];
    for (let i = 0; i < Math.min(4, simulators.length); i++) {
      const index = (activeIndex + i) % simulators.length;
      visible.push({ ...simulators[index], originalIndex: index });
    }
    return visible;
  };

  const visibleSimulators = getVisibleSimulators();

  return (
    <section id="simulateurs" className="pt-6 pb-12 md:py-16 lg:py-20 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header - Style Guides */}
        <div className="mb-12">
          {/* Green accent line */}
          <div className="w-16 h-1.5 bg-primary rounded-full mb-4"></div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground mb-3 flex items-center gap-2 flex-wrap">
            <span>Simulateurs</span>
            <span className="text-primary">Prime</span>
            <span>énergies</span>
            <Zap className="w-5 h-5 md:w-6 md:h-6 text-primary" />
          </h2>
          
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
            Choisissez un simulateur pour estimer vos gains et aides en quelques clics.
          </p>
        </div>

        {/* Simulators Grid with Featured Card */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Featured Card (Active) */}
            <div className="lg:col-span-5">
              <Card className={`group relative overflow-hidden border-2 border-primary/30 shadow-xl bg-gradient-to-br from-white to-primary/5 h-full transition-all duration-500`}>
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${visibleSimulators[0]?.gradient} opacity-5`}></div>
                
                <CardContent className="p-6 md:p-8 relative z-10 flex flex-col h-full">
                  {/* Badge Active */}
                  <div className="absolute top-4 right-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${visibleSimulators[0]?.gradient}`}>
                      <Zap className="w-3 h-3" />
                      Populaire
                    </span>
                  </div>

                  {/* Icon/Image */}
                  <div className={`${visibleSimulators[0]?.iconBg} w-24 h-24 rounded-2xl flex items-center justify-center mb-6 shadow-lg relative overflow-hidden`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${visibleSimulators[0]?.gradient} opacity-10 rounded-2xl`}></div>
                    {visibleSimulators[0]?.image && (
                      <img 
                        src={visibleSimulators[0].image} 
                        alt={visibleSimulators[0].title}
                        className="w-16 h-16 object-contain"
                      />
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">
                    {visibleSimulators[0]?.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {visibleSimulators[0]?.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-3 mb-6 flex-grow">
                    {visibleSimulators[0]?.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 text-primary`} />
                        <span className="text-sm text-foreground font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button 
                    className={`w-full bg-gradient-to-r ${visibleSimulators[0]?.gradient} hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-white font-semibold py-6 text-base`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {visibleSimulators[0]?.ctaText}
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Other Cards (Smaller) */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
                {visibleSimulators.slice(1, 4).map((simulator, idx) => (
                  <Card 
                    key={simulator.id} 
                    className="group relative overflow-hidden border hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card cursor-pointer"
                    onClick={() => setActiveIndex(simulator.originalIndex)}
                  >
                    <CardContent className="p-5 relative z-10 flex flex-col h-full">
                      {/* Icon/Image */}
                      <div className={`${simulator.iconBg} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300 shadow-md relative overflow-hidden`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${simulator.gradient} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`}></div>
                        {simulator.image && (
                          <img 
                            src={simulator.image} 
                            alt={simulator.title}
                            className={`${simulator.id === 'classe-energetique' ? 'w-8 h-8' : 'w-10 h-10'} object-contain`}
                          />
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-2">
                        {simulator.title}
                      </h3>

                      {/* Description */}
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-grow line-clamp-2">
                        {simulator.description}
                      </p>

                      {/* Mini CTA */}
                      <div className={`inline-flex items-center gap-1 text-sm font-semibold bg-gradient-to-r ${simulator.gradient} bg-clip-text text-transparent group-hover:gap-2 transition-all duration-300`}>
                        Découvrir
                        <ArrowRight className={`w-4 h-4 text-orange-500`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="h-11 w-11 bg-primary/10 hover:bg-primary hover:text-white border-2 border-primary/30 hover:border-primary transition-all duration-300 hover:scale-110 shadow-lg rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            {/* Dots indicator */}
            <div className="flex items-center gap-2">
              {simulators.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    idx === activeIndex 
                      ? 'bg-primary w-6' 
                      : 'bg-primary/30 hover:bg-primary/50'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="h-11 w-11 bg-primary/10 hover:bg-primary hover:text-white border-2 border-primary/30 hover:border-primary transition-all duration-300 hover:scale-110 shadow-lg rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10">
          <p className="text-lg text-muted-foreground mb-4 font-medium">
            Besoin d'aide pour choisir ? Nos experts sont là pour vous accompagner
          </p>
          <Button 
            size="lg"
            variant="outline"
            className="border-2 border-primary/50 hover:bg-primary hover:text-white font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Contacter un expert
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SimulatorsSection;
