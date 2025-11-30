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
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter les conditions générales d'utilisation",
  }),
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
    acceptTerms: false,
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
        acceptTerms: false,
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
        <div className="flex flex-col gap-8 max-w-[1400px] mx-auto">
          {/* Top: Hero text and buttons - centered content */}
          <div className="flex flex-col items-center justify-center text-white pt-8">
            <div className="w-full text-center">
              <h1 className="text-3xl lg:text-5xl font-bold mb-4 leading-tight">
                Réduisez vos factures énergétiques jusqu'à 80% !
              </h1>
              <p className="text-base lg:text-lg mb-6 text-white/90 leading-snug">
                Bénéficiez d'une étude énergétique gratuite et découvrez les travaux
                subventionnés adaptés à votre logement
              </p>

              {/* Quick action buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <Link 
                  to="/offres/panneaux-solaires"
                  className="group flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/80 hover:border-white/30 transition-all shadow-lg"
                >
                  <Sun className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                  <span className="text-white font-semibold text-sm">Panneaux solaires</span>
                </Link>

                <Link 
                  to="/offres/pompe-a-chaleur"
                  className="group flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/80 hover:border-white/30 transition-all shadow-lg"
                >
                  <Droplets className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span className="text-white font-semibold text-sm">Pompe à chaleur</span>
                </Link>

                <Link 
                  to="/offres/isolation"
                  className="group flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/80 hover:border-white/30 transition-all shadow-lg"
                >
                  <Home className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white font-semibold text-sm">Isolation</span>
                </Link>

                <Link 
                  to="/aides"
                  className="group flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-black/70 backdrop-blur-sm border border-white/20 hover:bg-black/80 hover:border-white/30 transition-all shadow-lg"
                >
                  <HandCoins className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <span className="text-white font-semibold text-sm">Aides & Subventions</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom: Modern horizontal form */}
          <div className="w-full pb-8">
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl shadow-2xl p-8 w-full relative overflow-hidden">
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                  <h2 className="text-lg md:text-lg lg:text-xl font-bold text-white drop-shadow-md flex-shrink">
                    Vérifier mon éligibilité à la Prime Gratuitement
                  </h2>
                  <div className="flex items-center gap-1.5 bg-white text-red-600 px-2.5 py-1 rounded-lg text-[10px] md:text-xs font-bold whitespace-nowrap shadow-lg border-2 border-red-100 flex-shrink-0">
                    <Home className="w-3 h-3 flex-shrink-0" strokeWidth={2.5} />
                    <span>Propriétaires maison individuelle</span>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit}>
                  {/* Responsive grid layout */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    {/* Nom complet - Full width on mobile, 1 column on tablet */}
                    <div className="md:col-span-1">
                      <Label htmlFor="fullName" className="text-white text-sm mb-1.5 block font-medium drop-shadow">
                        Nom complet <span className="text-yellow-300">*</span>
                      </Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Nom complet"
                        className="h-11 bg-white/95 backdrop-blur border-0 shadow-md text-sm focus:ring-2 focus:ring-white/50 transition-all hover:bg-white"
                        required
                      />
                    </div>

                    {/* Téléphone - Half width on mobile, 1 column on tablet */}
                    <div className="col-span-1 md:col-span-1">
                      <Label htmlFor="phone" className="text-white text-sm mb-1.5 block font-medium drop-shadow">
                        Téléphone <span className="text-yellow-300">*</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Téléphone"
                        className="h-11 bg-white/95 backdrop-blur border-0 shadow-md text-sm focus:ring-2 focus:ring-white/50 transition-all hover:bg-white"
                        required
                      />
                    </div>

                    {/* E-mail - Half width on mobile, 1 column on tablet */}
                    <div className="col-span-1 md:col-span-1">
                      <Label htmlFor="email" className="text-white text-sm mb-1.5 block font-medium drop-shadow">
                        E-mail <span className="text-yellow-300">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Ex. email@example.fr"
                        className="h-11 bg-white/95 backdrop-blur border-0 shadow-md text-sm focus:ring-2 focus:ring-white/50 transition-all hover:bg-white"
                        required
                      />
                    </div>

                    {/* Code postal - Half width on mobile, 1 column on tablet */}
                    <div className="col-span-1 md:col-span-1">
                      <Label htmlFor="postalCode" className="text-white text-sm mb-1.5 block font-medium drop-shadow">
                        Code postal <span className="text-yellow-300">*</span>
                      </Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        placeholder="Code postal"
                        maxLength={5}
                        className="h-11 bg-white/95 backdrop-blur border-0 shadow-md text-sm focus:ring-2 focus:ring-white/50 transition-all hover:bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Type de travaux + Button - Second row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {/* Type de travaux - Half width on mobile, spans 1 on tablet */}
                    <div>
                      <Label htmlFor="workType" className="text-white text-sm mb-1.5 block font-medium drop-shadow">
                        Type de travaux <span className="text-yellow-300">*</span>
                      </Label>
                      <Select value={formData.workType} onValueChange={(value) => setFormData({ ...formData, workType: value })}>
                        <SelectTrigger className="h-11 bg-white/95 backdrop-blur border-0 shadow-md text-sm focus:ring-2 focus:ring-white/50 transition-all hover:bg-white">
                          <SelectValue placeholder="Panneaux..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50 shadow-xl">
                          <SelectItem value="isolation">Isolation</SelectItem>
                          <SelectItem value="chauffage">Chauffage</SelectItem>
                          <SelectItem value="energie-solaire">Panneaux photovoltaïques</SelectItem>
                          <SelectItem value="renovation-globale">Rénovation globale</SelectItem>
                          <SelectItem value="ne-sait-pas">Ne sait pas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Button - Full width on mobile, aligned with workType on tablet */}
                    <div className="flex items-end">
                      <Button
                        type="submit" 
                        className="h-11 w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg text-sm transition-all hover:scale-105 hover:shadow-xl" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Envoi..." : "Envoyer"}
                      </Button>
                    </div>
                  </div>

                  {/* Checkbox CGU */}
                  <div className="flex items-start gap-3 mt-4">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                      className="mt-1 h-5 w-5 rounded border-2 border-white bg-white/90 text-emerald-600 focus:ring-2 focus:ring-white/50 flex-shrink-0 cursor-pointer transition-all"
                      required
                    />
                    <Label htmlFor="acceptTerms" className="text-white text-sm leading-relaxed cursor-pointer drop-shadow">
                      J'accepte les termes et conditions des CGU de Prime énergies et accepte de recevoir des offres concernant les travaux de rénovation et subventions{" "}
                      <Link 
                        to="/conditions-utilisation" 
                        target="_blank"
                        className="underline hover:text-yellow-200 font-semibold transition-colors"
                      >
                        CGU
                      </Link>
                    </Label>
                  </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
      </div>
    </section>
  );
};

export default HeroSection;
