import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sun, Droplets, Home, HandCoins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HeroSliderSettings {
  enabled: boolean;
  duration: number; // en secondes
  images: string[];
  overlayColor: string;
  overlayIntensity: number;
}

const HeroSection = () => {
  const [sliderSettings, setSliderSettings] = useState<HeroSliderSettings>({
    enabled: false,
    duration: 5,
    images: [],
    overlayColor: '#000000',
    overlayIntensity: 50,
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    loadSliderSettings();
  }, []);

  const loadSliderSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "hero_slider")
        .maybeSingle();

      if (error) {
        console.error("Supabase error loading hero slider:", error);
        return;
      }

      console.log("Hero slider data loaded:", data);

      if (data?.value) {
        const value = data.value as any;
        if (value && typeof value === 'object') {
          console.log("Setting slider settings:", value);
          setSliderSettings({
            enabled: value.enabled || false,
            duration: value.duration || 5,
            images: Array.isArray(value.images) ? value.images : [],
            overlayColor: value.overlayColor || '#000000',
            overlayIntensity: value.overlayIntensity || 50,
          });
        }
      } else {
        console.log("No hero slider data found");
      }
    } catch (error) {
      console.error("Error loading hero slider settings:", error);
    }
  };

  // Gestion du carrousel automatique
  useEffect(() => {
    if (!sliderSettings.enabled || sliderSettings.images.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentImageIndex((prev) => 
          (prev + 1) % sliderSettings.images.length
        );
        setIsTransitioning(false);
      }, 500); // Durée de la transition fade
    }, sliderSettings.duration * 1000);

    return () => clearInterval(interval);
  }, [sliderSettings]);

  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
      {/* Background images with crossfade */}
      <div className="absolute inset-0 z-0">
        {sliderSettings.images.length > 0 ? (
          sliderSettings.images.map((image, index) => (
            <div
              key={index}
              className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
              style={{
                backgroundImage: `url(${image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: currentImageIndex === index ? 1 : 0,
                zIndex: currentImageIndex === index ? 1 : 0,
              }}
            />
          ))
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-primary/40" />
        )}
        {/* Superposition de couleur personnalisée */}
        <div 
          className="absolute inset-0 z-10"
          style={{
            backgroundColor: sliderSettings.overlayColor,
            opacity: sliderSettings.overlayIntensity / 100,
          }}
        />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-center lg:items-start max-w-[1200px] mx-auto">
          {/* Left: Hero text and buttons */}
          <div className="text-white w-full lg:w-auto flex-shrink-0">
            <h1 className="text-4xl lg:text-5xl font-bold mb-5 leading-tight max-w-[550px]">
              Réduisez vos factures énergétiques jusqu'à 80% !
            </h1>
            <p className="text-base lg:text-lg mb-6 text-white/90 max-w-[480px]">
              Bénéficiez d'une étude énergétique gratuite et découvrez les travaux
              subventionnés adaptés à votre logement
            </p>

            {/* Quick action buttons - tailles fixes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 w-full sm:w-auto">
              <Link 
                to="/offres/panneaux-solaires"
                className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/80 hover:border-white/30 transition-all shadow-lg w-full sm:w-[280px]"
              >
                <Sun className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <span className="text-white font-semibold text-sm">Panneaux solaires</span>
              </Link>

              <Link 
                to="/offres/pompe-a-chaleur"
                className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/80 hover:border-white/30 transition-all shadow-lg w-full sm:w-[280px]"
              >
                <Droplets className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span className="text-white font-semibold text-sm">Pompe à chaleur</span>
              </Link>

              <Link 
                to="/offres/isolation"
                className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/80 hover:border-white/30 transition-all shadow-lg w-full sm:w-[280px]"
              >
                <Home className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-white font-semibold text-sm">Isolation</span>
              </Link>

              <Link 
                to="/aides"
                className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/80 hover:border-white/30 transition-all shadow-lg w-full sm:w-[280px]"
              >
                <HandCoins className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <span className="text-white font-semibold text-sm">Aides & Subventions</span>
              </Link>
            </div>
          </div>

          {/* Right: Form placeholder */}
          <div className="w-full lg:w-[480px] flex-shrink-0">
            <div className="bg-white rounded-xl shadow-2xl p-7 w-full mx-auto lg:mx-0">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Étude énergétique gratuite
              </h2>
              <p className="text-base text-muted-foreground mb-6">
                Découvrez vos économies potentielles et les aides disponibles en quelques clics
              </p>
              <Button asChild className="w-full h-12 text-base font-semibold" size="lg">
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
