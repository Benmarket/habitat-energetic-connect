import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import solarHouseBanner from "@/assets/solar-house-banner.jpg";
import solarSystemDiagram from "@/assets/solar-system-diagram.png";
import guarantee25Years from "@/assets/guarantee-25-years.png";

const SolarBanner = () => {
  return (
    <section className="py-12 lg:py-16 bg-gradient-to-b from-blue-50/30 to-background">
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
              
              {/* Grid with text on left, diagram on right */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start">
                {/* Left column - Text */}
                <div>
                  <p className="text-sm lg:text-base text-foreground leading-relaxed mb-6">
                    Le photovoltaïque permet de produire votre propre électricité grâce à l'énergie solaire, 
                    une ressource gratuite et inépuisable. En plus de réduire vos factures, c'est un 
                    investissement rentable grâce aux aides de l'État qui peuvent couvrir une partie de 
                    l'installation. De plus, avec le contrat EDF OA (Obligation d'Achat), vous avez la 
                    possibilité de revendre le surplus d'électricité produit, assurant ainsi un 
                    revenu complémentaire. En choisissant le photovoltaïque, vous contribuez à la 
                    transition énergétique tout en réalisant d'importantes économies.
                  </p>
                  
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

                {/* Right column - Diagram with legend */}
                <div className="space-y-4">
                  <img
                    src={solarSystemDiagram}
                    alt="Schéma du système photovoltaïque"
                    className="w-full max-w-[280px] mx-auto md:mx-0"
                  />
                  <div className="space-y-2 max-w-[280px] mx-auto md:mx-0">
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 mt-1 rounded bg-orange-500 flex-shrink-0"></div>
                      <p className="text-xs lg:text-sm text-foreground font-medium">
                        Capter les rayons du soleil et les convertir en kW utilisable
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-4 h-4 mt-1 rounded bg-cyan-500 flex-shrink-0"></div>
                      <p className="text-xs lg:text-sm text-foreground font-medium">
                        Revente du surplus non consommé vers le circuit général
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolarBanner;
