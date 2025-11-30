import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import renovationImage from "@/assets/renovation-ampleur.png";

const RenovationProgramSection = () => {
  return (
    <section className="py-12 lg:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-7xl mx-auto">
          {/* Left side - Image with overlay text */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              {/* Image */}
              <div className="w-full aspect-[4/3]">
                <img
                  src={renovationImage}
                  alt="Maison en rénovation énergétique"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Green overlay text banner */}
              <div className="absolute top-8 left-0 right-0 px-4">
                <div className="bg-primary text-white px-6 py-3 rounded-lg shadow-lg inline-block max-w-[90%]">
                  <p className="text-base lg:text-lg font-bold">
                    Jusqu'à 63 000€ de subvention pour vos travaux de rénovation énergétique
                  </p>
                </div>
              </div>

              {/* Energy class badge */}
              <div className="absolute bottom-8 left-8">
                <div className="bg-primary text-white rounded-lg p-4 shadow-xl flex items-center justify-center">
                  <span className="text-5xl font-extrabold">A</span>
                </div>
                <div className="mt-2 flex gap-1">
                  <div className="w-8 h-6 bg-green-600 rounded"></div>
                  <div className="w-8 h-6 bg-yellow-400 rounded"></div>
                  <div className="w-8 h-6 bg-orange-500 rounded"></div>
                  <div className="w-8 h-6 bg-red-600 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Content */}
          <div className="space-y-6">
            <div>
              <div className="inline-block w-16 h-1 bg-blue-600 mb-4"></div>
              <h2 className="text-2xl lg:text-4xl font-extrabold text-foreground mb-6 leading-tight">
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
    </section>
  );
};

export default RenovationProgramSection;
