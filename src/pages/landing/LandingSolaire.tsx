import { Helmet } from "react-helmet";
import { useState, useRef, useEffect, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Sun,
  ArrowRight,
  Home,
  Building2,
  CheckCircle2,
  Flame,
  Lock,
  ShieldCheck,
  Sparkles,
  Clock,
} from "lucide-react";
import LandingPageGuard from "@/components/LandingPageGuard";
import { useLandingPageSEO } from "@/hooks/useLandingPageSEO";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

import solarHouseBanner from "@/assets/solar-house-banner.jpg";
import solarSystemDiagram from "@/assets/solar-system-diagram-new.png";
import guarantee25Years from "@/assets/guarantee-25-years.png";
import ecologiqueImg from "@/assets/why-solar/ecologique.png";
import factureEdfImg from "@/assets/why-solar/facture-edf-new.png";
import appliPvImg from "@/assets/why-solar/appli-pv.jpg";
import smartphoneImg from "@/assets/why-solar/utilise-smartphone.png";
import fondGris from "@/assets/landing/fond-gris.png";
import SolarHeroVisual from "@/components/landing/SolarHeroVisual";
import SolarHowItWorks from "@/components/landing/SolarHowItWorks";
import SolarAidesFinancieres from "@/components/landing/SolarAidesFinancieres";
import SolarTestimonials from "@/components/landing/SolarTestimonials";
import SolarFAQ from "@/components/landing/SolarFAQ";
import SolarCounters from "@/components/landing/SolarCounters";
import SolarComparatif from "@/components/landing/SolarComparatif";
import SolarStickyCTA from "@/components/landing/SolarStickyCTA";
import { lazy } from "react";
import { useGLTF } from "@react-three/drei";

// Preload GLB models immediately (doesn't block render, just starts fetch)
useGLTF.preload("/models/solar_panel.glb");
useGLTF.preload("/models/solar_panel_flat.glb");

// Eagerly start loading the chunk (but render lazily with Suspense)
const solar3DPromise = import("@/components/landing/Solar3DShowcase");
const Solar3DShowcase = lazy(() => solar3DPromise);

// ─── Logos partenaires (hébergés sur le stockage cloud) ───
const STORAGE_BASE = "https://ggucavhanqmdxjqdbcnw.supabase.co/storage/v1/object/public/media/logos";

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

// ─── Schemas de validation wizard (une étape = une question / un couple de champs) ───
const stepChauffageSchema = z.object({
  chauffage: z.string().min(1, "Veuillez sélectionner votre type de chauffage"),
});
const stepSurfaceSchema = z.object({
  surface: z.string().min(1, "Veuillez indiquer la surface"),
});
const stepLocalisationSchema = z.object({
  postalCode: z.string().regex(/^\d{5}$/, "Code postal invalide"),
  city: z.string().min(1, "Veuillez indiquer la ville"),
});
const stepIdentiteSchema = z.object({
  lastName: z.string().min(1, "Veuillez indiquer votre nom"),
  firstName: z.string().min(1, "Veuillez indiquer votre prénom"),
});
const stepContactSchema = z.object({
  email: z.string().email("Email invalide"),
  phone: z.string().min(10, "Numéro de téléphone invalide"),
});

// ─── Image éligibilité ───
const solarPanelsImg = eligibiliteBg;

// Testimonials are now handled by SolarTestimonials component

const LandingSolaireContent = () => {
  const { seoStatus, canonicalUrl } = useLandingPageSEO("solaire");
  const [heroSlides, setHeroSlides] = useState<{ src: string; alt: string }[] | undefined>();
  const [heroBadge, setHeroBadge] = useState<string | undefined>();
  const [show3DDebug, setShow3DDebug] = useState(false);

  useEffect(() => {
    const fetchProductContent = async () => {
      const { data } = await supabase
        .from("landing_pages")
        .select("regional_content")
        .eq("slug", "solaire")
        .eq("level", "product")
        .maybeSingle();
      if (data?.regional_content) {
        const rc = data.regional_content as any;
        if (rc.hero_slides?.length) setHeroSlides(rc.hero_slides);
        // Resolve badge: direct hero_badge or from hero_badges for "fr"
        const badge = rc.hero_badge
          || (rc.hero_badges as any[])?.find((b: any) => b.regions?.includes("fr"))?.src;
        if (badge) setHeroBadge(badge);
        if (rc.show_3d_debug === true) setShow3DDebug(true);
      }
    };
    fetchProductContent();
  }, []);

  // Why solar benefits
  const benefits = [
    {
      image: ecologiqueImg,
      title: "Écologique",
      description:
        "L'énergie solaire utilise la lumière du soleil pour produire de l'électricité sans émission nocive.",
    },
    {
      image: factureEdfImg,
      title: "Économique",
      description:
        "Votre installation solaire peut vous faire réaliser jusqu'à 70% d'économie sur votre facture d'électricité.",
    },
    {
      image: smartphoneImg,
      title: "Maîtrise",
      description: "Maîtrisez votre consommation électrique en produisant votre propre énergie.",
    },
    {
      image: appliPvImg,
      title: "Connecté",
      description: "Contrôlez la production de votre installation photovoltaïque depuis votre smartphone.",
    },
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
    setWizardData((d) => ({ ...d, propertyType: choice }));
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

      // Fire-and-forget confirmation email
      const { sendFormConfirmationEmail } = await import("@/lib/sendFormConfirmationEmail");
      sendFormConfirmationEmail({
        formIdentifier: "landing-solaire",
        recipient: {
          email: wizardData.email,
          firstName: wizardData.firstName,
          lastName: wizardData.lastName,
          phone: wizardData.phone,
        },
        formLabel: "votre demande de devis solaire",
        requestSummary: `Panneaux solaires • ${wizardData.postalCode} ${wizardData.city}`,
      });

      const params = new URLSearchParams({
        name: `${wizardData.firstName} ${wizardData.lastName}`,
        workType: "panneaux-solaires",
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
    <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
      <Lock className="w-3 h-3" />
      Données chiffrées · Aucun spam ·{" "}
      <Link to="/politique-confidentialite" className="text-primary hover:underline">
        confidentialité
      </Link>
    </p>
  );

  const StepTip = ({ icon: Icon, children }: { icon: any; children: React.ReactNode }) => (
    <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-xs text-amber-900">
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
      <p className="leading-snug">{children}</p>
    </div>
  );

  const surfaceOptions = [
    { value: "<100m2", label: "< 100 m²" },
    { value: "100-150m2", label: "100-150 m²" },
    { value: "150-200m2", label: "150-200 m²" },
    { value: ">200m2", label: "> 200 m²" },
  ];
  const chauffageOptions = [
    { value: "Fioul", label: "🛢️ Fioul" },
    { value: "Gaz", label: "🔥 Gaz" },
    { value: "Électricité", label: "⚡ Électricité" },
    { value: "Bois", label: "🪵 Bois" },
    { value: "Pompe à chaleur", label: "♨️ Pompe à chaleur" },
    { value: "Autre", label: "❓ Autre" },
  ];


  // ─── City auto-fill from postal code ───
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);

  const handlePostalCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 5);
    setWizardData((d) => ({ ...d, postalCode: value, city: "" }));
    setCitySuggestions([]);

    if (value.length === 5) {
      try {
        const res = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${value}&fields=nom&limit=10`);
        if (res.ok) {
          const data = await res.json();
          const cities: string[] = data.map((c: { nom: string }) => c.nom);
          setCitySuggestions(cities);
          if (cities.length === 1) {
            setWizardData((d) => ({ ...d, city: cities[0] }));
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
          <h3 className="text-xl font-bold text-center mb-2" style={{ color: "#5b7a5b" }}>
            Vérifier mon éligibilité à la prime énergie :
          </h3>
          <p className="text-center text-sm text-muted-foreground mb-4">
            Testez votre éligibilité aux aides et subventions en <span className="underline font-medium">1 minute</span>{" "}
            sur notre site.
          </p>
          <Progress value={progressValue} className="mb-6 h-3" />
          <p className="text-center text-sm text-muted-foreground mb-4">Vous êtes :</p>
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
            style={{ backgroundColor: "#5b7a5b" }}
            tabIndex={-1}
          >
            &gt; Continuer
          </Button>
          <StepTip icon={ShieldCheck}>
            Étude <strong>100% gratuite et sans engagement</strong>. Nos experts vous rappellent sous 24h.
          </StepTip>
          {dataFooter}
        </div>
      );
    }

    if (wizardStep === 2) {
      return (
        <div key="step2" className="animate-fade-in">
          <h3 className="text-xl font-bold text-center mb-1" style={{ color: "#5b7a5b" }}>
            Parlez-nous de votre logement
          </h3>
          <p className="text-center text-xs text-muted-foreground mb-4">
            Pour estimer vos économies et les aides 2026 auxquelles vous avez droit.
          </p>
          <Progress value={progressValue} className="mb-5 h-3" />

          <div className="mb-4">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-600" />
              Mode de chauffage principal *
            </Label>
            <select
              value={wizardData.chauffage}
              onChange={(e) => setWizardData((d) => ({ ...d, chauffage: e.target.value }))}
              className="mt-1.5 w-full h-11 rounded-md border border-input bg-background px-3 text-sm font-medium"
            >
              <option value="">— Sélectionner —</option>
              {chauffageOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <Label className="text-sm font-medium">Surface habitable *</Label>
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
              {surfaceOptions.map((o) => {
                const active = wizardData.surface === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setWizardData((d) => ({ ...d, surface: o.value }))}
                    className={`h-11 rounded-md border-2 text-xs font-semibold transition-all ${active ? "border-[#5b7a5b] bg-[#5b7a5b]/10 text-[#5b7a5b]" : "border-border bg-background text-foreground hover:border-[#5b7a5b]/50"}`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <Label className="text-sm font-medium">Code postal *</Label>
              <Input
                placeholder="Ex : 75001"
                value={wizardData.postalCode}
                onChange={handlePostalCodeChange}
                maxLength={5}
                inputMode="numeric"
                className="mt-1.5 bg-background h-11"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Ville *</Label>
              {citySuggestions.length > 1 ? (
                <select
                  value={wizardData.city}
                  onChange={(e) => setWizardData((d) => ({ ...d, city: e.target.value }))}
                  className="mt-1.5 w-full h-11 rounded-md border border-input bg-background px-3 text-sm"
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
                  onChange={(e) => setWizardData((d) => ({ ...d, city: e.target.value }))}
                  className="mt-1.5 bg-background h-11"
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
              style={{ backgroundColor: "#5b7a5b" }}
              onClick={handleStep2Continue}
            >
              &gt; Continuer
            </Button>
          </div>

          <StepTip icon={Sparkles}>
            <strong>Jusqu'à 11 000 € d'aides cumulables</strong> en 2026 (prime à l'autoconsommation, TVA réduite, Éco-PTZ).
          </StepTip>
          {dataFooter}
        </div>
      );
    }


    if (wizardStep === 3) {
      return (
        <div key="step3" className="animate-fade-in">
          <h3 className="text-xl font-bold text-center mb-1" style={{ color: "#5b7a5b" }}>
            Dernière étape : votre étude offerte
          </h3>
          <p className="text-center text-xs text-muted-foreground mb-4">
            Un conseiller vous rappelle sous 24h avec un plan de financement personnalisé.
          </p>
          <Progress value={progressValue} className="mb-5 h-3" />
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Label className="text-sm font-medium">Prénom *</Label>
              <Input
                placeholder="Prénom"
                value={wizardData.firstName}
                onChange={(e) => setWizardData((d) => ({ ...d, firstName: e.target.value }))}
                className="mt-1.5 bg-background h-11"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Nom *</Label>
              <Input
                placeholder="Nom"
                value={wizardData.lastName}
                onChange={(e) => setWizardData((d) => ({ ...d, lastName: e.target.value }))}
                className="mt-1.5 bg-background h-11"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <Label className="text-sm font-medium">E-mail *</Label>
              <Input
                type="email"
                placeholder="votre@email.fr"
                value={wizardData.email}
                onChange={(e) => setWizardData((d) => ({ ...d, email: e.target.value }))}
                className="mt-1.5 bg-background h-11"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Téléphone *</Label>
              <Input
                type="tel"
                placeholder="06 12 34 56 78"
                value={wizardData.phone}
                onChange={(e) => setWizardData((d) => ({ ...d, phone: e.target.value }))}
                className="mt-1.5 bg-background h-11"
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
              style={{ backgroundColor: "#5b7a5b" }}
              onClick={handleStep3Submit}
            >
              {isSubmitting ? "Envoi..." : "> Recevoir mon étude"}
            </Button>
          </div>
          <StepTip icon={Clock}>
            <strong>Réponse sous 24h</strong> avec votre simulation chiffrée et le détail des aides 2026.
          </StepTip>
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
        <meta
          name="description"
          content="Profitez des aides pour installer vos panneaux solaires photovoltaïques. Réduisez vos factures d'électricité et produisez votre propre énergie verte."
        />
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

      <div className="min-h-screen bg-background overflow-x-hidden">
        <Header />

        <main>
          {/* ═══ BAND 1: Hero Banner ═══ */}
          <section className="relative pt-6 pb-6 lg:pt-22 lg:pb-14 px-4 overflow-hidden">
            {/* Background image */}
            <img src={fondGris} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
            <div className="absolute inset-0 bg-background/30" aria-hidden="true" />

            <div className="container mx-auto max-w-7xl relative z-10">
              <h1
                className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-center mb-1 bg-gradient-to-r from-emerald-600 via-green-500 to-teal-600 bg-clip-text text-transparent drop-shadow-sm leading-tight"
              >
                Faites installer vos panneaux solaires
              </h1>
              <p className="text-center text-sm lg:text-lg text-foreground mb-3 lg:mb-6">
                Faites jusqu'à <strong className="text-emerald-600">70% d'économie</strong> tous les mois pendant <span className="bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 rounded-md text-white font-bold shadow-sm">30 ans</span> avec une centrale solaire en autoconsommation.
              </p>

              <div className="grid lg:grid-cols-[3fr_2fr] gap-4 lg:gap-10 items-stretch">
                {/* Left: Product visual + text side by side */}
                <div className="flex items-center">
                  <SolarHeroVisual customSlides={heroSlides} badgeSrc={heroBadge} />
                </div>

                {/* Right: Eligibility wizard */}
                <div
                  ref={formRef}
                  id="formulaire-solaire"
                  className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-lg"
                >
                  {renderWizardContent()}
                </div>
              </div>
            </div>
          </section>

          {/* ═══ BAND 1.5: 3D Solar Showcase ═══ */}
          <Suspense fallback={<div className="h-screen bg-[#0a1628]" />}>
            <Solar3DShowcase showDebug={show3DDebug} />
          </Suspense>

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
                      Le photovoltaïque permet de produire votre propre électricité grâce à l'énergie solaire, une
                      ressource gratuite et inépuisable. En plus de réduire vos factures, c'est un investissement
                      rentable grâce aux aides de l'État. Avec le contrat EDF OA, vous pouvez revendre le surplus
                      d'électricité produit.
                    </p>
                    <div className="flex flex-col items-center">
                      <img src={solarSystemDiagram} alt="Schéma photovoltaïque" className="w-full max-w-[252px] mb-4" />
                      <div className="space-y-2 w-full max-w-[280px]">
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 mt-1 rounded bg-destructive/70 flex-shrink-0"></div>
                          <p className="text-sm text-foreground font-medium">
                            Capter les rayons du soleil et les convertir en kW
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 mt-1 rounded bg-accent flex-shrink-0"></div>
                          <p className="text-sm text-foreground font-medium">Revente du surplus non consommé</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl font-semibold gap-2"
                      onClick={scrollToForm}
                    >
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
                <Carousel
                  opts={{ align: "start", loop: true }}
                  plugins={[Autoplay({ delay: 5000 })]}
                  className="relative"
                >
                  <CarouselContent>
                    {benefits.map((b, i) => (
                      <CarouselItem key={i} className="md:basis-1/2">
                        <div className="flex flex-col items-center text-center px-4">
                          <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-6 overflow-hidden hover:scale-110 transition-transform">
                            <img
                              src={b.image}
                              alt={b.title}
                              className={`w-full h-full ${i === 1 ? "object-cover scale-[2]" : "object-cover"}`}
                            />
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
                      <img
                        src={b.image}
                        alt={b.title}
                        className={`w-full h-full ${i === 1 ? "object-cover scale-[2]" : "object-cover"}`}
                      />
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
                <h2 className="text-2xl lg:text-4xl font-extrabold">Quels sont les critères d'éligibilité ?</h2>
                <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
                  Vérifiez en quelques secondes si vous remplissez les conditions pour bénéficier des aides à
                  l'installation solaire.
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
                    Pour bénéficier de l'installation de panneaux solaires et des aides associées, vous devez remplir
                    les critères suivants :
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
                    <strong className="text-foreground">💡 Bon à savoir :</strong> Même les locataires peuvent
                    bénéficier d'aides pour l'installation solaire avec l'accord du propriétaire.
                  </div>

                  <Button
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/5 font-semibold rounded-full px-8"
                    onClick={scrollToForm}
                  >
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

          {/* ═══ BAND 5: Comment ça marche ═══ */}
          <SolarHowItWorks onCtaClick={scrollToForm} />

          {/* ═══ BAND 6: Compteurs animés ═══ */}
          <SolarCounters />

          {/* ═══ BAND 7: Comparatif puissances ═══ */}
          <SolarComparatif onCtaClick={scrollToForm} />

          {/* ═══ BAND 8: Aides financières ═══ */}
          <SolarAidesFinancieres region="france" onCtaClick={scrollToForm} />

          {/* ═══ BAND 9: Témoignages ═══ */}
          <SolarTestimonials region="france" />

          {/* ═══ BAND 10: FAQ ═══ */}
          <SolarFAQ region="france" />

          {/* ═══ BAND 11: Badges défilants 4/4 ═══ */}
          <section className="py-8 lg:py-10 bg-background">
            <div className="container mx-auto px-4 max-w-5xl">
              <Carousel opts={{ align: "start", loop: true }} plugins={[Autoplay({ delay: 2500, stopOnInteraction: false })]} className="w-full">
                <CarouselContent className="-ml-4">
                  {badges.map((badge, i) => (
                    <CarouselItem key={i} className="pl-4 basis-1/2 md:basis-1/4">
                      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-center h-24">
                        <img src={badge.logo} alt={badge.name} loading="lazy" className="h-14 w-auto object-contain" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </section>

          {/* ═══ BAND 12: CTA final ═══ */}
          <section className="py-12 lg:py-16 bg-primary/5">
            <div className="container mx-auto px-4 max-w-3xl text-center">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-foreground mb-4">
                Prêt à passer au solaire ?
              </h2>
              <p className="text-base text-muted-foreground mb-8">
                Testez votre éligibilité en 1 minute et découvrez les aides auxquelles vous avez droit.
              </p>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-12 text-lg" onClick={scrollToForm}>
                Je teste mon éligibilité
              </Button>
            </div>
          </section>
        </main>

        <Footer />
        <SolarStickyCTA onCtaClick={scrollToForm} />
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
