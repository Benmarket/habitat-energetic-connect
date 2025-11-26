import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Gauge, 
  Sun, 
  Flame, 
  ShieldCheck, 
  Wind, 
  TrendingUp,
  ArrowRight,
  Zap
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
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
  icon?: React.ElementType;
  image?: string;
  gradient: string;
  iconBg: string;
  ctaText: string;
}

const SimulatorsSection = () => {
  const simulators: Simulator[] = [
    {
      id: "classe-energetique",
      title: "Classe énergétique",
      description: "Estimez la classe énergétique de votre logement pour connaître vos aides éligibles.",
      image: classeEnergetiqueImg,
      gradient: "from-blue-500 to-cyan-500",
      iconBg: "bg-blue-50",
      ctaText: "Simuler ma classe"
    },
    {
      id: "solaire",
      title: "Économies avec le solaire",
      description: "Projetez vos économies potentielles grâce à l'installation photovoltaïque.",
      image: maisonSolaireImg,
      gradient: "from-orange-500 to-yellow-500",
      iconBg: "bg-orange-50",
      ctaText: "Simuler le solaire"
    },
    {
      id: "pompe-chaleur",
      title: "Chauffage pompe à chaleur",
      description: "Comparez vos coûts actuels et potentiels avec une PAC adaptée.",
      image: pompeChaleurImg,
      gradient: "from-red-500 to-orange-500",
      iconBg: "bg-red-50",
      ctaText: "Simuler la PAC"
    },
    {
      id: "isolation",
      title: "Isolation thermique",
      description: "Évaluez le gain énergétique et les économies via une meilleure isolation.",
      image: isolationImg,
      gradient: "from-purple-500 to-pink-500",
      iconBg: "bg-purple-50",
      ctaText: "Simuler l'isolation"
    },
    {
      id: "eolienne",
      title: "Production Éolienne",
      description: "Calculez la production potentielle et le retour sur investissement.",
      image: eolienneImg,
      gradient: "from-teal-500 to-cyan-500",
      iconBg: "bg-teal-50",
      ctaText: "Simuler l'éolien"
    },
    {
      id: "global",
      title: "Simulateur Subventions",
      description: "Obtenez une vision globale de vos économies multi-solutions.",
      image: simulateurSubventionsImg,
      gradient: "from-indigo-500 to-purple-600",
      iconBg: "bg-indigo-50",
      ctaText: "Lancer le simulateur"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-background via-primary/5 to-accent/10 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6 bg-gradient-to-r from-primary/20 to-accent/20 px-8 py-4 rounded-full backdrop-blur-sm border border-primary/20 shadow-lg">
            <Zap className="w-7 h-7 text-primary animate-pulse" />
            <h2 className="text-5xl font-extrabold flex items-center gap-2">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Simulateurs</span>
              <span className="text-primary">Prime</span>
              <span className="text-foreground">énergies</span>
            </h2>
            <Zap className="w-7 h-7 text-primary animate-pulse" />
          </div>
          <p className="text-2xl text-muted-foreground font-medium max-w-3xl mx-auto mt-4">
            Choisissez un simulateur pour estimer vos gains et aides en quelques clics
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-transparent rounded-full"></div>
            <div className="w-20 h-1 bg-gradient-to-r from-accent to-transparent rounded-full"></div>
            <div className="w-20 h-1 bg-gradient-to-r from-primary to-transparent rounded-full"></div>
          </div>
        </div>

        {/* Simulators Carousel */}
        <div className="max-w-7xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {simulators.map((simulator) => {
                const IconComponent = simulator.icon;
                return (
                  <CarouselItem key={simulator.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 bg-card/50 backdrop-blur-sm h-full">
                      {/* Gradient overlay on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${simulator.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                      
                      {/* Animated border gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${simulator.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500`}></div>
                      
                      <CardContent className="p-8 relative z-10 flex flex-col h-full">
                        {/* Icon or Image */}
                        <div className={`${simulator.iconBg} w-20 h-20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500 shadow-lg group-hover:shadow-xl relative overflow-hidden`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${simulator.gradient} opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-500`}></div>
                          {simulator.image ? (
                            <img 
                              src={simulator.image} 
                              alt={simulator.title}
                              className={`${simulator.id === 'classe-energetique' ? 'w-10 h-10' : 'w-14 h-14'} object-contain group-hover:scale-110 transition-transform duration-500`}
                            />
                          ) : IconComponent ? (
                            <IconComponent className={`w-10 h-10 bg-gradient-to-br ${simulator.gradient} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-500`} strokeWidth={2.5} />
                          ) : null}
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors duration-300">
                          {simulator.title}
                        </h3>

                        {/* Description */}
                        <p className="text-muted-foreground leading-relaxed mb-6 flex-grow">
                          {simulator.description}
                        </p>

                        {/* CTA Button */}
                        <Button 
                          className={`w-full bg-gradient-to-r ${simulator.gradient} hover:shadow-xl hover:scale-105 transition-all duration-300 text-white font-semibold py-6 text-base group/btn relative overflow-hidden`}
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            {simulator.ctaText}
                            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                          </span>
                          <div className="absolute inset-0 bg-white/20 transform translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
                        </Button>

                        {/* Decorative corner element */}
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${simulator.gradient} opacity-0 group-hover:opacity-10 rounded-bl-full transition-all duration-500 transform translate-x-16 -translate-y-16 group-hover:translate-x-0 group-hover:translate-y-0`}></div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            
            {/* Navigation Buttons */}
            <div className="flex justify-center gap-4 mt-12">
              <CarouselPrevious className="relative inset-0 translate-y-0 h-14 w-14 bg-primary/10 hover:bg-primary hover:text-white border-2 border-primary/30 hover:border-primary transition-all duration-300 hover:scale-110 shadow-lg" />
              <CarouselNext className="relative inset-0 translate-y-0 h-14 w-14 bg-primary/10 hover:bg-primary hover:text-white border-2 border-primary/30 hover:border-primary transition-all duration-300 hover:scale-110 shadow-lg" />
            </div>
          </Carousel>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
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
