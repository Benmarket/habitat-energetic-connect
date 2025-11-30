import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import solarHouseBanner from "@/assets/solar-house-banner.jpg";
import solarSystemDiagram from "@/assets/solar-system-diagram-new.png";
import guarantee25Years from "@/assets/guarantee-25-years.png";

const SolarBanner = () => {
  return (
    <section className="py-6 md:py-12 lg:py-16 bg-gradient-to-b from-blue-50/30 to-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Image with guarantee badge */}
          <div className="relative">
            <img
              src={solarHouseBanner}
              alt="Maison avec panneaux solaires photovoltaïques"
              className="rounded-2xl shadow-2xl w-full object-cover md:max-h-[300px] lg:max-h-none"
            />
            <div className="absolute top-4 left-4 w-20 h-20 lg:w-28 lg:h-28">
              <img
                src={guarantee25Years}
                alt="Garantie de puissance 25 ans"
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Right side - Content */}
          <div className="space-y-6">
            <div>
              <div className="inline-block w-16 h-1 bg-primary mb-4"></div>
              <h2 className="text-2xl lg:text-4xl font-extrabold text-foreground mb-6 leading-tight">
                Générer de l'électricité avec des panneaux solaires photovoltaïques
              </h2>
              
              {/* Mobile Layout - Diagram with legend beside */}
              <div className="md:hidden flex gap-3 items-start mb-4">
                <img
                  src={solarSystemDiagram}
                  alt="Schéma du système photovoltaïque"
                  className="w-1/2 max-w-[180px]"
                />
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 mt-0.5 rounded bg-orange-500 flex-shrink-0"></div>
                    <p className="text-[10px] text-foreground font-medium leading-tight">
                      Capter les rayons du soleil et les convertir en kW utilisable
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 mt-0.5 rounded bg-cyan-500 flex-shrink-0"></div>
                    <p className="text-[10px] text-foreground font-medium leading-tight">
                      Revente du surplus non consommé vers le circuit général
                    </p>
                  </div>
                </div>
              </div>

              {/* Tablet Layout - Grid with text left, diagram+legend right */}
              <div className="hidden md:grid lg:hidden grid-cols-2 gap-6 mb-6">
                {/* Left Column - Text */}
                <div className="space-y-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    Le photovoltaïque permet de produire votre propre électricité grâce à l'énergie solaire, 
                    une ressource gratuite et inépuisable. En plus de réduire vos factures, c'est un 
                    investissement rentable grâce aux aides de l'État qui peuvent couvrir une partie de 
                    l'installation. De plus, avec le contrat EDF OA (Obligation d'Achat), vous avez la 
                    possibilité de revendre le surplus d'électricité produit, assurant ainsi un 
                    revenu complémentaire. En choisissant le photovoltaïque, vous contribuez à la 
                    transition énergétique tout en réalisant d'importantes économies.
                  </p>
                </div>

                {/* Right Column - Diagram and legend stacked */}
                <div className="flex flex-col items-center">
                  <img
                    src={solarSystemDiagram}
                    alt="Schéma du système photovoltaïque"
                    className="w-full max-w-[280px] mb-4"
                  />
                  <div className="space-y-2 w-full">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 mt-1 rounded bg-orange-500 flex-shrink-0"></div>
                      <p className="text-xs text-foreground font-medium leading-tight">
                        Capter les rayons du soleil et les convertir en kW utilisable
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 mt-1 rounded bg-cyan-500 flex-shrink-0"></div>
                      <p className="text-xs text-foreground font-medium leading-tight">
                        Revente du surplus non consommé vers le circuit général
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Layout - Diagram with legend beside */}
              <div className="hidden lg:flex gap-4 items-start mb-6">
                <img
                  src={solarSystemDiagram}
                  alt="Schéma du système photovoltaïque"
                  className="w-1/2 max-w-[252px]"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 mt-1 rounded bg-orange-500 flex-shrink-0"></div>
                    <p className="text-sm text-foreground font-medium leading-tight">
                      Capter les rayons du soleil et les convertir en kW utilisable
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 mt-1 rounded bg-cyan-500 flex-shrink-0"></div>
                    <p className="text-sm text-foreground font-medium leading-tight">
                      Revente du surplus non consommé vers le circuit général
                    </p>
                  </div>
                </div>
              </div>

              {/* Text below - Mobile & Desktop only */}
              <p className="md:hidden lg:block text-xs lg:text-base text-foreground leading-relaxed mb-4 md:mb-6">
                Le photovoltaïque permet de produire votre propre électricité grâce à l'énergie solaire, 
                une ressource gratuite et inépuisable. En plus de réduire vos factures, c'est un 
                investissement rentable grâce aux aides de l'État qui peuvent couvrir une partie de 
                l'installation. De plus, avec le contrat EDF OA (Obligation d'Achat), vous avez la 
                possibilité de revendre le surplus d'électricité produit, assurant ainsi un 
                revenu complémentaire. En choisissant le photovoltaïque, vous contribuez à la 
                transition énergétique tout en réalisant d'importantes économies.
              </p>
              
              {/* Button */}
              <div className="flex justify-center">
                <Link to="/offres/panneaux-solaires">
                  <Button 
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white shadow-xl font-semibold gap-2"
                  >
                    Ça m'intéresse
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolarBanner;
