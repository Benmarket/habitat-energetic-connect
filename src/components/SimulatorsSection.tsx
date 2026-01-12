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
            <CarouselContent className="-ml-2 md:-ml-4">
              {simulators.map((simulator, index) => {
                const isActive = index === current;
                
                return (
                  <CarouselItem 
                    key={simulator.id} 
                    className={`pl-2 md:pl-4 basis-[85%] sm:basis-1/2 ${
                      isActive 
                        ? 'md:basis-[45%] lg:basis-[35%]' 
                        : 'md:basis-[22%] lg:basis-[16%]'
                    }`}
                  >
                    <Card className={`group relative overflow-hidden border-2 transition-all duration-300 ease-out bg-card/50 backdrop-blur-sm h-full ${
                      isActive 
                        ? 'border-primary/50 shadow-2xl' 
                        : 'hover:border-primary/30 hover:shadow-xl hover:-translate-y-1'
                    }`}>
                      {/* Gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${simulator.gradient} ${isActive ? 'opacity-5' : 'opacity-0 group-hover:opacity-10'} transition-opacity duration-300`}></div>
                      
                      <CardContent className={`relative z-10 flex flex-col h-full transition-all duration-300 ${isActive ? 'p-5 md:p-6' : 'p-4'}`}>
                        {/* Icon or Image */}
                        <div className={`${simulator.iconBg} ${isActive ? 'w-16 h-16 md:w-18 md:h-18' : 'w-12 h-12'} rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-105 transition-all duration-300 shadow-md relative overflow-hidden`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${simulator.gradient} opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300`}></div>
                          {simulator.image && (
                            <img 
                              src={simulator.image} 
                              alt={simulator.title}
                              className={`${isActive ? 'w-10 h-10 md:w-12 md:h-12' : 'w-8 h-8'} ${simulator.id === 'classe-energetique' ? (isActive ? 'w-8 h-8 md:w-10 md:h-10' : 'w-6 h-6') : ''} object-contain group-hover:scale-105 transition-transform duration-300`}
                            />
                          )}
                        </div>

                        {/* Title */}
                        <h3 className={`font-bold mb-2 group-hover:text-primary transition-colors duration-300 ${
                          isActive ? 'text-lg md:text-xl' : 'text-sm md:text-base'
                        }`}>
                          {simulator.title}
                        </h3>

                        {/* Description */}
                        <p className={`text-muted-foreground leading-relaxed mb-3 flex-grow ${
                          isActive ? 'text-sm md:text-base' : 'text-xs line-clamp-2'
                        }`}>
                          {simulator.description}
                        </p>

                        {/* Features - Only for active card */}
                        {isActive && (
                          <div className="space-y-1.5 mb-4 border-t border-border/50 pt-3">
                            {simulator.features.map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                <span className="text-xs md:text-sm text-foreground">{feature}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* CTA Button */}
                        <Button 
                          className={`w-full bg-gradient-to-r ${simulator.gradient} hover:shadow-lg hover:scale-[1.02] transition-all duration-300 text-white font-semibold group/btn relative overflow-hidden ${
                            isActive ? 'py-5 text-sm md:text-base' : 'py-3 text-xs'
                          }`}
                        >
                          <span className="relative z-10 flex items-center justify-center gap-1.5">
                            {simulator.ctaText}
                            <ArrowRight className={`${isActive ? 'w-4 h-4' : 'w-3 h-3'} group-hover/btn:translate-x-0.5 transition-transform duration-300`} />
                          </span>
                          <div className="absolute inset-0 bg-white/20 transform translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500"></div>
                        </Button>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            
            {/* Navigation Buttons */}
            <div className="flex justify-center gap-3 mt-6">
              <CarouselPrevious className="relative inset-0 translate-y-0 h-10 w-10 bg-primary/10 hover:bg-primary hover:text-white border-2 border-primary/30 hover:border-primary transition-all duration-300 shadow-md" />
              <CarouselNext className="relative inset-0 translate-y-0 h-10 w-10 bg-primary/10 hover:bg-primary hover:text-white border-2 border-primary/30 hover:border-primary transition-all duration-300 shadow-md" />
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
