import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight,
  Zap,
  CheckCircle2
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
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
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

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

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

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

        {/* Simulators Carousel */}
        <div className="max-w-7xl mx-auto mt-6">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {simulators.map((simulator, index) => {
                const isActive = index === current;
                
                return (
                  <CarouselItem 
                    key={simulator.id} 
                    className={`pl-4 transition-all duration-500 ${
                      isActive ? 'md:basis-1/2 lg:basis-2/5' : 'md:basis-1/3 lg:basis-1/5'
                    }`}
                  >
                    <Card className={`group relative overflow-hidden border-2 transition-all duration-500 bg-card/50 backdrop-blur-sm h-full ${
                      isActive 
                        ? 'border-primary/50 shadow-2xl scale-100' 
                        : 'hover:border-primary/30 hover:shadow-xl hover:-translate-y-2'
                    }`}>
                      {/* Gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${simulator.gradient} ${isActive ? 'opacity-5' : 'opacity-0 group-hover:opacity-10'} transition-opacity duration-500`}></div>
                      
                      <CardContent className={`relative z-10 flex flex-col h-full ${isActive ? 'p-6 md:p-8' : 'p-5'}`}>
                        {/* Icon or Image */}
                        <div className={`${simulator.iconBg} ${isActive ? 'w-20 h-20' : 'w-14 h-14'} rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-all duration-500 shadow-lg relative overflow-hidden`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${simulator.gradient} opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-500`}></div>
                          {simulator.image && (
                            <img 
                              src={simulator.image} 
                              alt={simulator.title}
                              className={`${isActive ? 'w-14 h-14' : 'w-10 h-10'} ${simulator.id === 'classe-energetique' ? (isActive ? 'w-10 h-10' : 'w-7 h-7') : ''} object-contain group-hover:scale-110 transition-transform duration-500`}
                            />
                          )}
                        </div>

                        {/* Title */}
                        <h3 className={`font-bold mb-3 group-hover:text-primary transition-colors duration-300 ${
                          isActive ? 'text-xl md:text-2xl' : 'text-base md:text-lg'
                        }`}>
                          {simulator.title}
                        </h3>

                        {/* Description */}
                        <p className={`text-muted-foreground leading-relaxed mb-4 flex-grow ${
                          isActive ? 'text-base' : 'text-sm line-clamp-2'
                        }`}>
                          {simulator.description}
                        </p>

                        {/* Features - Only for active card */}
                        {isActive && (
                          <div className="space-y-2 mb-5 border-t border-border/50 pt-4">
                            {simulator.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                                <span className="text-sm text-foreground">{feature}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* CTA Button */}
                        <Button 
                          className={`w-full bg-gradient-to-r ${simulator.gradient} hover:shadow-xl hover:scale-105 transition-all duration-300 text-white font-semibold group/btn relative overflow-hidden ${
                            isActive ? 'py-6 text-base' : 'py-4 text-sm'
                          }`}
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            {simulator.ctaText}
                            <ArrowRight className={`${isActive ? 'w-5 h-5' : 'w-4 h-4'} group-hover/btn:translate-x-1 transition-transform duration-300`} />
                          </span>
                          <div className="absolute inset-0 bg-white/20 transform translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                        </Button>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            
            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-6">
              <CarouselPrevious className="relative inset-0 translate-y-0 h-11 w-11 bg-primary/10 hover:bg-primary hover:text-white border-2 border-primary/30 hover:border-primary transition-all duration-300 hover:scale-110 shadow-lg" />
              <CarouselNext className="relative inset-0 translate-y-0 h-11 w-11 bg-primary/10 hover:bg-primary hover:text-white border-2 border-primary/30 hover:border-primary transition-all duration-300 hover:scale-110 shadow-lg" />
            </div>
          </Carousel>
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
