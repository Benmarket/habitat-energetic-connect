import { Helmet } from "react-helmet";
import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Sun, ArrowRight, Home, Building2, Quote, ChevronLeft, ChevronRight,
  Truck, Wrench, Power, CheckCircle2
} from "lucide-react";
import LandingPageGuard from "@/components/LandingPageGuard";
import { useLandingPageSEO } from "@/hooks/useLandingPageSEO";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

import solarHouseBanner from "@/assets/solar-house-banner.jpg";
import solarSystemDiagram from "@/assets/solar-system-diagram-new.png";
import guarantee25Years from "@/assets/guarantee-25-years.png";
import ecologiqueImg from "@/assets/why-solar/ecologique.png";
import factureEdfImg from "@/assets/why-solar/facture-edf-new.png";
import appliPvImg from "@/assets/why-solar/appli-pv.jpg";
import smartphoneImg from "@/assets/why-solar/utilise-smartphone.png";
import fondGris from "@/assets/landing/fond-gris.png";
import panneauxSolaires from "@/assets/landing/panneaux-solaires.png";
import onduleur from "@/assets/landing/onduleur.png";
import marqueFrancaise from "@/assets/landing/marque-francaise.png";
import macaronPrix from "@/assets/landing/macaron-prix.png";
import heroToitureTuiles from "@/assets/landing/hero-toiture-tuiles.jpg";
import heroToiturePlate from "@/assets/landing/hero-toiture-plate.jpg";
import realisationFamille from "@/assets/landing/realisation-famille.png";
import realisationAccompagnement from "@/assets/landing/realisation-accompagnement.png";
import realisationTropicale from "@/assets/landing/realisation-tropicale.png";

// ─── Logos partenaires (hébergés sur le stockage cloud) ───
const STORAGE_BASE = "https://ggucavhanqmdxjqdbcnw.supabase.co/storage/v1/object/public/media/logos";

// ─── Hero backgrounds ───
const heroBackgrounds = [fondGris, heroToitureTuiles, heroToiturePlate];

// ─── Band 4: Critères d'éligibilité image ───
import eligibiliteBg from "@/assets/landing/panneaux-solaires.png";

// ─── Band 7: Badges data ───
const badges = [
  { name: "RGE QualiPV", logo: `${STORAGE_BASE}/rge-qualipv.png` },
  { name: "MaPrimeRénov'", logo: `${STORAGE_BASE}/maprimerenov.png` },
  { name: "CEE", logo: `${STORAGE_BASE}/cee.png` },
  { name: "Domofinance", logo: `${STORAGE_BASE}/domofinance.png` },
  { name: "QualiPac", logo: `${STORAGE_BASE}/qualipac.png` },
  { name: "France Rénov'", logo: `${STORAGE_BASE}/france-renov.png` },
  { name: "ADEME", logo: `${STORAGE_BASE}/ademe.png` },
  { name: "Eco PTZ", logo: `${STORAGE_BASE}/eco-ptz.png` },
];

// ─── Schemas de validation wizard ───
const step2Schema = z.object({
  chauffage: z.string().min(1, "Veuillez sélectionner votre type de chauffage"),
  surface: z.string().min(1, "Veuillez indiquer la surface"),
  postalCode: z.string().regex(/^\d{5}$/, "Code postal invalide"),
  city: z.string().min(1, "Veuillez indiquer la ville"),
});

const step3Schema = z.object({
  lastName: z.string().min(1, "Veuillez indiquer votre nom"),
  firstName: z.string().min(1, "Veuillez indiquer votre prénom"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
});

// ─── Image éligibilité ───
const solarPanelsImg = eligibiliteBg;

const testimonials = [
  {
    text: "J'ai bénéficié du programme de financement Eco PTZ et je suis passée à l'énergie solaire. Je suis très satisfaite de ce dispositif et de la qualité de l'installation.",
    name: "Marie B.",
  },
  {
    text: "Prise de contact rapide, mise en place du dossier de financement et installation au top ! Je recommande fortement !",
    name: "Paul D.",
  },
  {
    text: "Pratique et efficace je peux contrôler ma production photovoltaïque avec l'application.",
    name: "Sylvie R.",
  },
];

const LandingSolaireContent = () => {
  const { seoStatus, canonicalUrl } = useLandingPageSEO("solaire");

  // ─── Hero background carousel ───
  const [heroBgIndex, setHeroBgIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroBgIndex(prev => (prev + 1) % heroBackgrounds.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const benefits = [
    { image: ecologiqueImg, title: "Écologique", description: "L'énergie solaire utilise la lumière du soleil pour produire de l'électricité sans émission nocive." },
    { image: factureEdfImg, title: "Économique", description: "Votre installation solaire peut vous faire réaliser jusqu'à 70% d'économie sur votre facture d'électricité." },
    { image: smartphoneImg, title: "Maîtrise", description: "Maîtrisez votre consommation électrique en produisant votre propre énergie." },
    { image: appliPvImg, title: "Connecté", description: "Contrôlez la production de votre installation photovoltaïque depuis votre smartphone." },
  ];

  // ─── Wizard state ───
  const navigate = useNavigate();
  const [wizardStep, setWizardStep] = useState(1); // 1=choice, 2=details, 3=contact
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const [wizardData, setWizardData] = useState({
    propertyType: "",
    chauffage: "",
    surface: "",
    postalCode: "",
    city: "",
    lastName: "",
    firstName: "",
    email: "",
    phone: "",
  });



  const handlePropertyChoice = (choice: string) => {
    setSelectedProperty(choice);
    setWizardData(d => ({ ...d, propertyType: choice }));
    setTimeout(() => setWizardStep(2), 500);
  };

  const handleStep2Continue = () => {
    try {
      step2Schema.parse({
        chauffage: wizardData.chauffage,
        surface: wizardData.surface,
        postalCode: wizardData.postalCode,
        city: wizardData.city,
      });
      setTimeout(() => setWizardStep(3), 400);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleStep3Submit = async () => {
    try {
      step3Schema.parse({
        lastName: wizardData.lastName,
        firstName: wizardData.firstName,
        email: wizardData.email,
        phone: wizardData.phone,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }
    setIsSubmitting(true);
    try {
      // Insert into leads table
      const { error: leadError } = await supabase.from("leads").insert({
        first_name: wizardData.firstName,
        last_name: wizardData.lastName,
        phone: wizardData.phone,
        email: wizardData.email,
        postal_code: wizardData.postalCode,
        city: wizardData.city,
        address: "N/A",
        property_type: wizardData.propertyType,
        needs: ["panneaux-solaires"],
        notes: `Landing solaire | Chauffage: ${wizardData.chauffage} | Surface: ${wizardData.surface}`,
        status: "new",
      });
      if (leadError) throw leadError;

      // Also insert into form_submissions for admin tracking
      const formConfigId = "058314de-16fc-4f17-bad3-fe51e3959109";
      await supabase.from("form_submissions").insert({
        form_id: formConfigId,
        data: {
          propertyType: wizardData.propertyType,
          chauffage: wizardData.chauffage,
          surface: wizardData.surface,
          postalCode: wizardData.postalCode,
          city: wizardData.city,
          lastName: wizardData.lastName,
          firstName: wizardData.firstName,
          email: wizardData.email,
          phone: wizardData.phone,
        },
        status: "new",
      });

      const params = new URLSearchParams({
        name: `${wizardData.firstName} ${wizardData.lastName}`,
        workType: "panneaux-solaires"
      });
      navigate(`/merci?${params.toString()}`);
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressValue = wizardStep === 1 ? 10 : wizardStep === 2 ? 55 : 90;

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const dataFooter = (
    <p className="text-center text-xs text-muted-foreground mt-6">
      Vos données sont protégées. En savoir plus sur notre{" "}
      <Link to="/politique-confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>.
    </p>
  );

  // ─── City auto-fill from postal code ───
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);

  const handlePostalCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setWizardData(d => ({ ...d, postalCode: value, city: '' }));
    setCitySuggestions([]);

    if (value.length === 5) {
      try {
        const res = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${value}&fields=nom&limit=10`);
        if (res.ok) {
          const data = await res.json();
          const cities: string[] = data.map((c: { nom: string }) => c.nom);
          setCitySuggestions(cities);
          if (cities.length === 1) {
            setWizardData(d => ({ ...d, city: cities[0] }));
          }
        }
      } catch {
        // silently fail, user can type manually
      }
    }
  };

  // ─── Wizard step renderers ───
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  const renderWizardContent = () => {
    if (wizardStep === 1) {
      return (
        <div className="animate-fade-in">
          <h3 className="text-xl font-bold text-center mb-2" style={{ color: '#5b7a5b' }}>
            Vérifier mon éligibilité à la prime énergie :
          </h3>
          <p className="text-center text-sm text-muted-foreground mb-4">
            Testez votre éligibilité aux aides et subventions en <span className="underline font-medium">1 minute</span> sur notre site.
          </p>
          <Progress value={progressValue} className="mb-6 h-3" />
          <p className="text-center text-sm text-muted-foreground mb-4">
            Vous êtes :
          </p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => handlePropertyChoice("maison")}
              className={`flex flex-col items-center gap-3 p-6 border-2 rounded-xl transition-all cursor-pointer ${selectedProperty === "maison" ? "border-primary bg-primary/10 animate-[bounce-step_0.4s_ease-out]" : "border-border hover:border-primary hover:bg-primary/5"}`}
            >
              <Home className="w-10 h-10 text-primary" />
              <span className="font-semibold text-foreground">Propriétaire</span>
            </button>
            <button
              onClick={() => handlePropertyChoice("locataire")}
              className={`flex flex-col items-center gap-3 p-6 border-2 rounded-xl transition-all cursor-pointer ${selectedProperty === "locataire" ? "border-primary bg-primary/10 animate-[bounce-step_0.4s_ease-out]" : "border-border hover:border-primary hover:bg-primary/5"}`}
            >
              <Building2 className="w-10 h-10 text-primary" />
              <span className="font-semibold text-foreground">Locataire</span>
            </button>
          </div>
          <Button
            size="lg"
            className="w-full text-white font-bold text-lg opacity-50 cursor-default"
            style={{ backgroundColor: '#5b7a5b' }}
            tabIndex={-1}
          >
            &gt; Continuer
          </Button>
          {dataFooter}
        </div>
      );
    }

    if (wizardStep === 2) {
      return (
        <div key="step2" className="animate-fade-in">
          <h3 className="text-xl font-bold text-center mb-2" style={{ color: '#5b7a5b' }}>
            Vérifier mon éligibilité à la prime énergie :
          </h3>
          <Progress value={progressValue} className="mb-6 h-3" />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium">Votre mode de chauffage principal: *</Label>
              <select
                value={wizardData.chauffage}
                onChange={(e) => setWizardData(d => ({ ...d, chauffage: e.target.value }))}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Sélectionner</option>
                <option value="Fioul">Fioul</option>
                <option value="Gaz">Gaz</option>
                <option value="Électricité">Électricité</option>
                <option value="Bois">Bois</option>
                <option value="Pompe à chaleur">Pompe à chaleur</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium">Surface de votre logement *</Label>
              <select
                value={wizardData.surface}
                onChange={(e) => setWizardData(d => ({ ...d, surface: e.target.value }))}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Sélectionner</option>
                <option value="<100m2">&lt;100m2</option>
                <option value="100-150m2">100-150m2</option>
                <option value="150-200m2">150-200m2</option>
                <option value=">200m2">&gt;200m2</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="text-sm font-medium">Code postal *</Label>
              <Input
                placeholder="Code postal"
                value={wizardData.postalCode}
                onChange={handlePostalCodeChange}
                maxLength={5}
                className="mt-1 bg-background"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Ville *</Label>
              {citySuggestions.length > 1 ? (
                <select
                  value={wizardData.city}
                  onChange={(e) => setWizardData(d => ({ ...d, city: e.target.value }))}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Sélectionner</option>
                  {citySuggestions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <Input
                  placeholder="Ville"
                  value={wizardData.city}
                  onChange={(e) => setWizardData(d => ({ ...d, city: e.target.value }))}
                  className="mt-1 bg-background"
                />
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 bg-muted/60 text-muted-foreground font-semibold"
              onClick={() => setWizardStep(1)}
            >
              Retour
            </Button>
            <Button
              size="lg"
              className="flex-[2] text-white font-bold text-lg hover:opacity-90"
              style={{ backgroundColor: '#5b7a5b' }}
              onClick={handleStep2Continue}
            >
              &gt; Continuer
            </Button>
          </div>
          {dataFooter}
        </div>
      );
    }

    if (wizardStep === 3) {
      return (
        <div key="step3" className="animate-fade-in">
          <h3 className="text-xl font-bold text-center mb-2" style={{ color: '#5b7a5b' }}>
            Vérifier mon éligibilité à la prime énergie :
          </h3>
          <Progress value={progressValue} className="mb-6 h-3" />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium">Nom *</Label>
              <Input
                placeholder="Nom"
                value={wizardData.lastName}
                onChange={(e) => setWizardData(d => ({ ...d, lastName: e.target.value }))}
                className="mt-1 bg-background"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Prénom *</Label>
              <Input
                placeholder="Prénom"
                value={wizardData.firstName}
                onChange={(e) => setWizardData(d => ({ ...d, firstName: e.target.value }))}
                className="mt-1 bg-background"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="text-sm font-medium">E-mail *</Label>
              <Input
                type="email"
                placeholder="E-mail"
                value={wizardData.email}
                onChange={(e) => setWizardData(d => ({ ...d, email: e.target.value }))}
                className="mt-1 bg-background"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Téléphone *</Label>
              <Input
                type="tel"
                placeholder="Téléphone"
                value={wizardData.phone}
                onChange={(e) => setWizardData(d => ({ ...d, phone: e.target.value }))}
                className="mt-1 bg-background"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 bg-muted/60 text-muted-foreground font-semibold"
              onClick={() => setWizardStep(2)}
            >
              Retour
            </Button>
            <Button
              size="lg"
              disabled={isSubmitting}
              className="flex-[2] text-white font-bold text-lg hover:opacity-90"
              style={{ backgroundColor: '#5b7a5b' }}
              onClick={handleStep3Submit}
            >
              {isSubmitting ? "Envoi..." : "> Envoyer"}
            </Button>
          </div>
          {dataFooter}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <Helmet>
        <title>Installation Panneaux Solaires Photovoltaïques | Prime Énergies</title>
        <meta name="description" content="Profitez des aides pour installer vos panneaux solaires photovoltaïques. Réduisez vos factures d'électricité et produisez votre propre énergie verte." />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        {seoStatus === "hidden" && <meta name="robots" content="noindex, nofollow" />}
      </Helmet>

      <style>{`
        @keyframes bounce-step {
          0% { transform: scale(0.97); opacity: 0.6; }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main>

          {/* ═══ BAND 1: Hero Banner ═══ */}
          <section className="relative pt-24 pb-12 lg:pt-28 lg:pb-20 px-4 overflow-hidden">
            {/* Background image */}
            <img src={fondGris} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
            <div className="absolute inset-0 bg-background/30" aria-hidden="true" />
            
            <div className="container mx-auto max-w-7xl relative z-10">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-center mb-2" style={{ color: '#3d8b37' }}>
                Faites installer vos panneaux solaires
              </h1>
              <p className="text-center text-base lg:text-lg text-foreground mb-8">
                Faites jusqu'à 70% d'économie sur 30 ans avec une centrale solaire en autoconsommation.
              </p>
              
              <div className="grid lg:grid-cols-[1fr_1fr] gap-6 lg:gap-8 items-center">
                {/* Left: Product visual + text side by side */}
                <div className="flex items-center gap-4 lg:gap-6">
                  {/* Panel with macaron overlay + onduleur overlay */}
                  <div className="relative flex-shrink-0">
                    {/* Macaron top-left */}
                    <img src={macaronPrix} alt="À partir de 35€/mois, primes déduites" className="absolute -top-4 -left-4 w-24 h-24 lg:w-28 lg:h-28 object-contain z-10" />
                    {/* Solar panels */}
                    <img src={panneauxSolaires} alt="Panneaux solaires" className="h-56 md:h-64 lg:h-80 object-contain" />
                    {/* Onduleur bottom-right on panel */}
                    <img src={onduleur} alt="Onduleur Hoymiles" className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 h-20 lg:h-28 object-contain" />
                  </div>

                  {/* Text beside the panel */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <img src={marqueFrancaise} alt="Marque Française" className="h-12 lg:h-14 object-contain" />
                      <img src={guarantee25Years} alt="Garantie 25 ans" className="w-16 h-16 lg:w-20 lg:h-20" />
                    </div>
                    <h2 className="text-lg lg:text-xl font-extrabold leading-tight">Propriétaire d'une maison individuelle ?</h2>
                    <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                      Passez <strong className="text-foreground">à l'énergie solaire</strong> et faites d'importantes économies sur votre <strong className="text-foreground">facture électrique.</strong>
                    </p>
                  </div>
                </div>

                {/* Right: Eligibility wizard */}
                <div ref={formRef} id="formulaire-solaire" className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-lg">
                  {renderWizardContent()}
                </div>
              </div>
            </div>
          </section>

          {/* ═══ BAND 2: Générer de l'électricité (from homepage) ═══ */}
          <section className="py-10 lg:py-16 bg-gradient-to-b from-primary/5 to-background">
            <div className="container mx-auto px-4">
              <div className="mb-8">
                <div className="inline-block w-16 h-1 bg-primary mb-4"></div>
                <h2 className="text-2xl lg:text-4xl font-extrabold text-foreground leading-tight">
                  Générer de l'électricité avec des panneaux solaires photovoltaïques
                </h2>
              </div>
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="relative rounded-2xl shadow-2xl overflow-hidden">
                  <img src={solarHouseBanner} alt="Maison avec panneaux solaires" className="w-full object-cover" />
                  <div className="absolute top-4 left-4 w-20 h-20 lg:w-28 lg:h-28">
                    <img src={guarantee25Years} alt="Garantie 25 ans" className="w-full h-full" />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <p className="text-base text-foreground leading-relaxed">
                      Le photovoltaïque permet de produire votre propre électricité grâce à l'énergie solaire, 
                      une ressource gratuite et inépuisable. En plus de réduire vos factures, c'est un 
                      investissement rentable grâce aux aides de l'État. Avec le contrat EDF OA, vous pouvez revendre le surplus d'électricité produit.
                    </p>
                    <div className="flex flex-col items-center">
                      <img src={solarSystemDiagram} alt="Schéma photovoltaïque" className="w-full max-w-[252px] mb-4" />
                      <div className="space-y-2 w-full max-w-[280px]">
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 mt-1 rounded bg-destructive/70 flex-shrink-0"></div>
                          <p className="text-sm text-foreground font-medium">Capter les rayons du soleil et les convertir en kW</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 mt-1 rounded bg-accent flex-shrink-0"></div>
                          <p className="text-sm text-foreground font-medium">Revente du surplus non consommé</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl font-semibold gap-2" onClick={scrollToForm}>
                      Ça m'intéresse <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ BAND 3: Pourquoi l'énergie solaire ? ═══ */}
          <section className="py-10 lg:py-20 bg-card overflow-hidden">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-center mb-12">
                Pourquoi <span className="text-primary">l'énergie solaire ?</span>
              </h2>
              {/* Mobile carousel */}
              <div className="lg:hidden pb-12">
                <Carousel opts={{ align: "start", loop: true }} plugins={[Autoplay({ delay: 5000 })]} className="relative">
                  <CarouselContent>
                    {benefits.map((b, i) => (
                      <CarouselItem key={i} className="md:basis-1/2">
                        <div className="flex flex-col items-center text-center px-4">
                          <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-6 overflow-hidden hover:scale-110 transition-transform">
                            <img src={b.image} alt={b.title} className={`w-full h-full ${i === 1 ? 'object-cover scale-[2]' : 'object-cover'}`} />
                          </div>
                          <h3 className="text-xl font-bold text-primary mb-4">{b.title}</h3>
                          <p className="text-sm text-foreground">{b.description}</p>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="opacity-60 hover:opacity-100 bg-card border-2" />
                  <CarouselNext className="opacity-60 hover:opacity-100 bg-card border-2" />
                </Carousel>
              </div>
              {/* Desktop grid */}
              <div className="hidden lg:grid grid-cols-4 gap-6 max-w-7xl mx-auto">
                {benefits.map((b, i) => (
                  <div key={i} className="flex flex-col items-center text-center">
                    <div className="w-40 h-40 rounded-full bg-muted flex items-center justify-center mb-6 overflow-hidden hover:scale-110 transition-transform cursor-pointer">
                      <img src={b.image} alt={b.title} className={`w-full h-full ${i === 1 ? 'object-cover scale-[2]' : 'object-cover'}`} />
                    </div>
                    <h3 className="text-2xl font-bold text-primary mb-4">{b.title}</h3>
                    <p className="text-base text-foreground">{b.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ BAND 4: Critères d'éligibilité ═══ */}
          <section className="py-12 lg:py-20 bg-muted">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="text-center mb-8">
                <div className="inline-block w-16 h-1 bg-primary mb-4"></div>
                <h2 className="text-2xl lg:text-4xl font-extrabold">
                  Quels sont les critères d'éligibilité ?
                </h2>
                <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
                  Vérifiez en quelques secondes si vous remplissez les conditions pour bénéficier des aides à l'installation solaire.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Colonne gauche : critères */}
                <div className="space-y-6">
                  <div className="flex gap-4 justify-center lg:justify-start">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Home className="w-7 h-7 text-primary" />
                    </div>
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-primary" />
                    </div>
                  </div>

                  <p className="text-base text-muted-foreground leading-relaxed">
                    Pour bénéficier de l'installation de panneaux solaires et des aides associées, vous devez remplir les critères suivants :
                  </p>

                  <ul className="space-y-4 text-foreground">
                    {[
                      "Être propriétaire ou copropriétaire d'un logement (maison individuelle ou immeuble).",
                      "Le logement doit être construit depuis plus de 2 ans.",
                      "Être raccordé au réseau électrique public (Enedis ou ELD).",
                      "Faire appel à un installateur certifié RGE (Reconnu Garant de l'Environnement).",
                      "Le logement doit être situé en France métropolitaine ou en Outre-mer.",
                      "Ne pas dépasser la puissance maximale de 500 kWc pour les particuliers.",
                    ].map((text, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-muted-foreground">
                    <strong className="text-foreground">💡 Bon à savoir :</strong> Même les locataires peuvent bénéficier d'aides pour l'installation solaire avec l'accord du propriétaire.
                  </div>

                  <Button variant="outline" className="border-primary text-primary hover:bg-primary/5 font-semibold rounded-full px-8" onClick={scrollToForm}>
                    Testez votre éligibilité gratuitement
                  </Button>
                </div>

                {/* Colonne droite : image */}
                <div className="rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src={solarPanelsImg}
                    alt="Toiture équipée de panneaux solaires photovoltaïques"
                    className="w-full h-auto object-cover"
                    loading="lazy"
                    width={1280}
                    height={720}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ═══ BAND 5: Notre prestation ═══ */}
          <section className="py-10 lg:py-16 bg-muted/50">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-2xl lg:text-4xl font-extrabold text-center mb-12">Notre prestation</h2>
              <div className="space-y-8">
                {[
                  {
                    icon: Truck,
                    text: "Primes-energies.fr vous aide à vérifier votre éligibilité à l'installation de panneaux solaires. Cette installation peut être financée en partie grâce au programme de transition énergétique et vous permet de faire l'acquisition de votre installation solaire livrée, installée, mise en service et garantie."
                  },
                  {
                    icon: Wrench,
                    text: "Nous nous occupons également de toutes les démarches administratives."
                  },
                  {
                    icon: Power,
                    text: "Afin de savoir le montant de vos aides octroyés, vous pouvez effectuer un test d'éligibilité sur notre site."
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed pt-2">{item.text}</p>
                  </div>
                ))}
                <div className="flex justify-center pt-4">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-10" onClick={scrollToForm}>
                    Testez votre éligibilité
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ BAND 6: Témoignages ═══ */}
          <section className="py-10 lg:py-16 bg-muted">
            <div className="container mx-auto px-4 max-w-6xl">
              <h2 className="text-2xl lg:text-4xl font-extrabold text-center mb-12">
                Déjà plus de <span className="text-primary">1000 clients</span> installés et satisfaits
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {testimonials.map((t, i) => (
                  <div key={i} className="text-center space-y-4">
                    <div className="flex justify-between px-4">
                      <Quote className="w-8 h-8 text-primary rotate-180" />
                      <Quote className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed px-2">{t.text}</p>
                    <p className="font-bold text-foreground">{t.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ BAND 7: Badges défilants ═══ */}
          <section className="py-10 lg:py-14 bg-background">
            <div className="container mx-auto px-4 max-w-5xl">
              <Carousel opts={{ align: "start", loop: true }} plugins={[Autoplay({ delay: 4000 })]} className="relative">
                <CarouselContent>
                  {/* Frame 1: badges 0-3 */}
                  <CarouselItem className="basis-full">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center py-4">
                      {badges.slice(0, 4).map((badge, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-4 w-full flex items-center justify-center h-24 shadow-sm hover:shadow-md transition-shadow">
                          <img src={badge.logo} alt={badge.name} loading="lazy" className="h-16 w-auto object-contain" />
                        </div>
                      ))}
                    </div>
                  </CarouselItem>
                  {/* Frame 2: badges 4-7 */}
                  <CarouselItem className="basis-full">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center py-4">
                      {badges.slice(4, 8).map((badge, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-4 w-full flex items-center justify-center h-24 shadow-sm hover:shadow-md transition-shadow">
                          <img src={badge.logo} alt={badge.name} loading="lazy" className="h-16 w-auto object-contain" />
                        </div>
                      ))}
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-12 opacity-50 hover:opacity-100" />
                <CarouselNext className="hidden md:flex -right-12 opacity-50 hover:opacity-100" />
              </Carousel>
            </div>
          </section>

        </main>

        <Footer />
      </div>
    </>
  );
};

const LandingSolaire = () => {
  return (
    <LandingPageGuard slug="solaire">
      <LandingSolaireContent />
    </LandingPageGuard>
  );
};

export default LandingSolaire;
