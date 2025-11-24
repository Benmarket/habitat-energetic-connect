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
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
          {/* Left: Hero text and buttons */}
          <div className="text-white w-full lg:w-auto lg:max-w-[600px] flex-shrink-0">
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Réduisez vos factures énergétiques jusqu'à 80% !
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Bénéficiez d'une étude énergétique gratuite et découvrez les travaux
              subventionnés adaptés à votre logement
            </p>

            {/* Quick action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-[600px]">
              <Link 
                to="/offres/panneaux-solaires"
                className="group flex items-center gap-4 px-6 py-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/50 hover:border-white/20 transition-all w-full"
              >
                <Sun className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                <span className="text-white font-medium text-lg">Panneaux solaires</span>
              </Link>

              <Link 
                to="/offres/pompe-a-chaleur"
                className="group flex items-center gap-4 px-6 py-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/50 hover:border-white/20 transition-all w-full"
              >
                <Droplets className="w-6 h-6 text-blue-400 flex-shrink-0" />
                <span className="text-white font-medium text-lg">Pompe à chaleur</span>
              </Link>

              <Link 
                to="/offres/isolation"
                className="group flex items-center gap-4 px-6 py-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/50 hover:border-white/20 transition-all w-full"
              >
                <Home className="w-6 h-6 text-green-400 flex-shrink-0" />
                <span className="text-white font-medium text-lg">Isolation</span>
              </Link>

              <Link 
                to="/aides"
                className="group flex items-center gap-4 px-6 py-4 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/50 hover:border-white/20 transition-all w-full"
              >
                <HandCoins className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                <span className="text-white font-medium text-lg">Aides & Subventions</span>
              </Link>
            </div>
          </div>

          {/* Right: Form placeholder - will be replaced with multi-step form */}
          <div className="w-full lg:w-auto flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-soft p-8 w-full max-w-md mx-auto lg:mx-0">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Étude énergétique gratuite
              </h2>
              <p className="text-muted-foreground mb-6">
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
