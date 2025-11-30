import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sun, Droplets, Home, HandCoins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface HeroSliderSettings {
  enabled: boolean;
  duration: number; // en secondes
  images: string[];
  overlayColor: string;
  overlayIntensity: number;
}

const formSchema = z.object({
  fullName: z.string().trim().min(1, "Le nom complet est requis"),
  phone: z.string().trim().min(10, "Téléphone invalide"),
  email: z.string().trim().email("Email invalide"),
  postalCode: z.string().trim().min(5, "Code postal invalide"),
  workType: z.string().min(1, "Veuillez sélectionner un type de travaux"),
});

const HeroSection = () => {
  const { toast } = useToast();
  const [sliderSettings, setSliderSettings] = useState<HeroSliderSettings>({
    enabled: false,
    duration: 5,
    images: [],
    overlayColor: '#000000',
    overlayIntensity: 50,
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    postalCode: "",
    workType: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      }, 500);
    }, sliderSettings.duration * 1000);

    return () => clearInterval(interval);
  }, [sliderSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validated = formSchema.parse(formData);

      // Récupérer la configuration du formulaire
      const { data: formConfig } = await supabase
        .from("form_configurations")
        .select("id")
        .eq("form_identifier", "hero-form-accueil")
        .maybeSingle();

      if (!formConfig) {
        toast({
          title: "Erreur",
          description: "Configuration du formulaire introuvable",
          variant: "destructive",
        });
        return;
      }

      // Soumettre les données
      const { error } = await supabase.from("form_submissions").insert({
        form_id: formConfig.id,
        data: validated,
      });

      if (error) throw error;

      toast({
        title: "Demande envoyée !",
        description: "Nous vous contacterons dans les plus brefs délais.",
      });

      setFormData({
        fullName: "",
        phone: "",
        email: "",
        postalCode: "",
        workType: "",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erreur de validation",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'envoi",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1200px] mx-auto">
          {/* Left cell: Hero text and buttons - centered content */}
          <div className="flex flex-col items-center lg:items-start justify-center text-white pt-8 lg:pt-0">
            <div className="w-full max-w-[550px]">
              <h1 className="text-3xl lg:text-5xl font-bold mb-4 leading-tight text-center lg:text-left">
                Réduisez vos factures énergétiques jusqu'à 80% !
              </h1>
              <p className="text-base lg:text-lg mb-6 text-white/90 text-center lg:text-left">
                Bénéficiez d'une étude énergétique gratuite et découvrez les travaux
                subventionnés adaptés à votre logement
              </p>

              {/* Quick action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 lg:mb-8 w-full">
                <Link 
                  to="/offres/panneaux-solaires"
                  className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/80 hover:border-white/30 transition-all shadow-lg"
                >
                  <Sun className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span className="text-white font-semibold text-sm">Panneaux solaires</span>
                </Link>

                <Link 
                  to="/offres/pompe-a-chaleur"
                  className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/80 hover:border-white/30 transition-all shadow-lg"
                >
                  <Droplets className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span className="text-white font-semibold text-sm">Pompe à chaleur</span>
                </Link>

                <Link 
                  to="/offres/isolation"
                  className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/80 hover:border-white/30 transition-all shadow-lg"
                >
                  <Home className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white font-semibold text-sm">Isolation</span>
                </Link>

                <Link 
                  to="/aides"
                  className="group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/80 hover:border-white/30 transition-all shadow-lg"
                >
                  <HandCoins className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <span className="text-white font-semibold text-sm">Aides & Subventions</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right cell: Form - centered content */}
          <div className="flex items-center justify-center pb-3 lg:pb-0">
            <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-[480px]">
              <h2 className="text-xl font-bold text-foreground mb-1">
                Étude énergétique gratuite
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Découvrez vos économies potentielles et les aides disponibles en quelques clics
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label htmlFor="fullName" className="text-sm mb-1">Nom complet</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Votre nom et prénom"
                    className="h-10"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm mb-1">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="06 12 34 56 78"
                    className="h-10"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm mb-1">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="votre@email.com"
                    className="h-10"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="postalCode" className="text-sm mb-1">Code postal</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="75001"
                    maxLength={5}
                    className="h-10"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="workType" className="text-sm mb-1">Type de travaux</Label>
                  <Select value={formData.workType} onValueChange={(value) => setFormData({ ...formData, workType: value })}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Sélectionnez..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="isolation">Isolation</SelectItem>
                      <SelectItem value="chauffage">Chauffage</SelectItem>
                      <SelectItem value="energie-solaire">Énergie solaire</SelectItem>
                      <SelectItem value="renovation-globale">Rénovation globale</SelectItem>
                      <SelectItem value="ne-sait-pas">Ne sait pas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-semibold mt-4" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Envoi en cours..." : "Commencer l'étude gratuite"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
