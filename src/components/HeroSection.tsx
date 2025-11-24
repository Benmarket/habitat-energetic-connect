import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sun, Droplets, Home, HandCoins } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-20">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-dark-bg-opacity to-dark-bg-opacity/70" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center lg:items-start max-w-[1200px] mx-auto">
          {/* Left: Hero text and buttons */}
          <div className="text-white w-full lg:w-auto flex-shrink-0">
            <h1 className="text-4xl lg:text-5xl font-bold mb-5 leading-tight max-w-[500px]">
              Réduisez vos factures énergétiques jusqu'à 80% !
            </h1>
            <p className="text-base lg:text-lg mb-6 text-white/90 max-w-[500px]">
              Bénéficiez d'une étude énergétique gratuite et découvrez les travaux
              subventionnés adaptés à votre logement
            </p>

            {/* Quick action buttons - tailles fixes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 w-full sm:w-auto">
              <Link 
                to="/offres/panneaux-solaires"
                className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/80 hover:border-white/30 transition-all shadow-lg w-full sm:w-[340px]"
              >
                <Sun className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <span className="text-white font-semibold text-base">Panneaux solaires</span>
              </Link>

              <Link 
                to="/offres/pompe-a-chaleur"
                className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/80 hover:border-white/30 transition-all shadow-lg w-full sm:w-[340px]"
              >
                <Droplets className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="text-white font-semibold text-base">Pompe à chaleur</span>
              </Link>

              <Link 
                to="/offres/isolation"
                className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/80 hover:border-white/30 transition-all shadow-lg w-full sm:w-[340px]"
              >
                <Home className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-white font-semibold text-base">Isolation</span>
              </Link>

              <Link 
                to="/aides"
                className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/80 hover:border-white/30 transition-all shadow-lg w-full sm:w-[340px]"
              >
                <HandCoins className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <span className="text-white font-semibold text-base">Aides & Subventions</span>
              </Link>
            </div>
          </div>

          {/* Right: Form placeholder - will be replaced with multi-step form */}
          <div className="w-full lg:w-[400px] flex-shrink-0">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full mx-auto lg:mx-0">
              <h2 className="text-xl font-bold text-foreground mb-2">
                Étude énergétique gratuite
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                Découvrez vos économies potentielles et les aides disponibles en quelques clics
              </p>
              <Button asChild className="w-full h-11 text-sm font-semibold" size="lg">
                <Link to="/etude-energetique">
                  Commencer l'étude gratuite
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
