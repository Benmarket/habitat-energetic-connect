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
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center lg:items-center">
          {/* Left: Hero text and buttons */}
          <div className="text-white w-full lg:w-[480px] flex-shrink-0">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Réduisez vos factures énergétiques jusqu'à 80% !
            </h1>
            <p className="text-lg mb-6 text-white/90">
              Bénéficiez d'une étude énergétique gratuite et découvrez les travaux
              subventionnés adaptés à votre logement
            </p>

            {/* Quick action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <Link 
                to="/offres/panneaux-solaires"
                className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/50 hover:border-white/20 transition-all"
              >
                <Sun className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <span className="text-white font-medium text-base">Panneaux solaires</span>
              </Link>

              <Link 
                to="/offres/pompe-a-chaleur"
                className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/50 hover:border-white/20 transition-all"
              >
                <Droplets className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="text-white font-medium text-base">Pompe à chaleur</span>
              </Link>

              <Link 
                to="/offres/isolation"
                className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/50 hover:border-white/20 transition-all"
              >
                <Home className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-white font-medium text-base">Isolation</span>
              </Link>

              <Link 
                to="/aides"
                className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/50 hover:border-white/20 transition-all"
              >
                <HandCoins className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <span className="text-white font-medium text-base">Aides & Subventions</span>
              </Link>
            </div>
          </div>

          {/* Right: Form placeholder - will be replaced with multi-step form */}
          <div className="w-full lg:w-[380px] flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-soft p-6 w-full mx-auto lg:mx-0">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Étude énergétique gratuite
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                Découvrez vos économies potentielles et les aides disponibles en quelques clics
              </p>
              <Button asChild className="w-full" size="lg">
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
