import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import renovationImage from "@/assets/renovation-ampleur.png";

const RenovationProgramSection = () => {
  return (
    <section className="py-6 md:py-8 lg:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-7xl mx-auto">
          {/* Left side - Image with overlay text */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              {/* Image */}
              <img
                src={renovationImage}
                alt="Maison en rénovation énergétique"
                className="w-full object-cover md:max-h-[300px] lg:max-h-none rounded-2xl"
              />
              
              {/* Green overlay text banner */}
              <div className="absolute top-8 left-0 right-0 px-4">
                <div className="bg-primary text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-lg inline-block max-w-[90%]">
                  <p className="text-sm md:text-base lg:text-lg font-bold leading-tight">
                    Jusqu'à 63 000€ de subvention pour vos travaux de rénovation énergétique
                  </p>
                </div>
              </div>

              {/* Energy class badge - smaller and cuter */}
              <div className="absolute bottom-8 left-8">
                <div className="bg-primary text-white rounded-md p-1.5 shadow-lg flex items-center justify-center">
                  <span className="text-base font-extrabold">A</span>
                </div>
                <div className="mt-1 flex gap-0.5">
                  <div className="w-3 h-2.5 bg-green-600 rounded-sm"></div>
                  <div className="w-3 h-2.5 bg-yellow-400 rounded-sm"></div>
                  <div className="w-3 h-2.5 bg-orange-500 rounded-sm"></div>
                  <div className="w-3 h-2.5 bg-red-600 rounded-sm"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Content */}
          <div className="space-y-6">
            <div>
              <div className="inline-block w-16 h-1 bg-blue-600 mb-4"></div>
              <h2 className="text-2xl lg:text-4xl font-extrabold text-foreground mb-6 leading-tight text-center lg:text-left">
                Le programme de Rénovation d'ampleur
              </h2>
              <p className="text-sm lg:text-base text-foreground leading-relaxed">
                Profitez de subventions allant jusqu'à 63 000 euros pour réaliser des bouquets de 
                travaux énergétiques et améliorer l'efficacité de votre logement. Voici les types de 
                travaux éligibles : isolation intérieure, extérieure, combles, remplacement du 
                système de chauffage par une pompe à chaleur air-eau ou air-air (climatiseur 
                réversible), installation de ballon d'eau chaude, double vitrage, et VMC (Ventilation 
                Mécanique Contrôlée). Avec ces aides, vous pouvez moderniser votre habitat tout en 
                réalisant des économies d'énergie significatives dans le but de gagner en 
                classe énergétique.
              </p>
            </div>

            <div className="flex justify-center">
              <Link to="/aides">
                <Button 
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg gap-2"
                >
                  Lire le guide
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RenovationProgramSection;
