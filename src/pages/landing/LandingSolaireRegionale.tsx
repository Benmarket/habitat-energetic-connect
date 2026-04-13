import { Helmet } from "react-helmet";
import { useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Sun, ArrowRight, Home, Building2, Quote, Zap, TrendingUp, Users,
  Truck, Wrench, Power, CheckCircle2, MapPin, Award, Shield, Loader2
} from "lucide-react";
import LandingPageGuard from "@/components/LandingPageGuard";
import { LandingServiceSchema } from "@/components/SEO/LandingServiceSchema";
import { useRegionalContent, type RegionalHighlight } from "@/hooks/useRegionalContent";
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
import SolarHeroVisual from "@/components/landing/SolarHeroVisual";
import solarPanelsImg from "@/assets/solar-panels.jpg";

// ─── Icon resolver ───
const iconMap: Record<string, React.ElementType> = {
  Sun, Zap, TrendingUp, Home, Users, MapPin, Award, Shield,
};

const resolveIcon = (iconName: string) => iconMap[iconName] || Sun;

// ─── Form schemas ───
const step2Schema = z.object({
  chauffage: z.string().min(1, "Le mode de chauffage est requis"),
  surface: z.string().min(1, "La surface est requise"),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Code postal invalide"),
  city: z.string().trim().min(1, "La ville est requise"),
});

const step3Schema = z.object({
  lastName: z.string().trim().min(1, "Le nom est requis"),
  firstName: z.string().trim().min(1, "Le prénom est requis"),
  email: z.string().trim().email("Email invalide"),
  phone: z.string().trim().min(10, "Téléphone invalide"),
});

// ─── Badges data ───
const badges = [
  { name: "RGE QualiPV", color: "text-purple-700" },
  { name: "MaPrimeRénov'", color: "text-teal-600" },
  { name: "CEE Certificats d'Économies d'Énergie", color: "text-green-700" },
  { name: "Domofinance", color: "text-orange-600" },
  { name: "QualiPac", color: "text-blue-700" },
  { name: "France Rénov'", color: "text-indigo-600" },
  { name: "ADEME", color: "text-emerald-700" },
  { name: "Eco PTZ", color: "text-amber-700" },
];

// ─── Default testimonials (fallback) ───
const defaultTestimonials = [
  { text: "J'ai bénéficié du programme de financement Eco PTZ et je suis passée à l'énergie solaire. Je suis très satisfaite de ce dispositif et de la qualité de l'installation.", name: "Marie B." },
  { text: "Prise de contact rapide, mise en place du dossier de financement et installation au top ! Je recommande fortement !", name: "Paul D." },
  { text: "Pratique et efficace je peux contrôler ma production photovoltaïque avec l'application.", name: "Sylvie R." },
];

const LandingSolaireRegionaleContent = ({ regionCode }: { regionCode: string }) => {
  const { content, simulatorData, seoStatus, canonicalUrl, loading, isRegional, filledSections } = useRegionalContent(regionCode);
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);

  // ─── Wizard state ───
  const [wizardStep, setWizardStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [wizardData, setWizardData] = useState({
    propertyType: "", chauffage: "", surface: "", postalCode: "",
    city: "", lastName: "", firstName: "", email: "", phone: "",
  });

  const regionName = content.region_name || regionCode;
  const seo = content.seo || {
    meta_title: `Installation Panneaux Solaires ${regionName} | Prime Énergies`,
    meta_description: `Profitez des aides pour installer vos panneaux solaires en ${regionName}.`,
    h1: `Faites installer vos panneaux solaires en ${regionName}`,
  };

  // Auto noindex if thin content
  const shouldNoindex = seoStatus === "hidden" || (isRegional && filledSections < 2);

  // ─── Benefits ───
  const benefits = [
    { image: ecologiqueImg, title: "Écologique", description: "L'énergie solaire utilise la lumière du soleil pour produire de l'électricité sans émission nocive." },
    { image: factureEdfImg, title: "Économique", description: `Votre installation solaire peut vous faire réaliser jusqu'à 70% d'économie sur votre facture d'électricité${isRegional ? ` en ${regionName}` : ""}.` },
    { image: smartphoneImg, title: "Maîtrise", description: "Maîtrisez votre consommation électrique en produisant votre propre énergie." },
    { image: appliPvImg, title: "Connecté", description: "Contrôlez la production de votre installation photovoltaïque depuis votre smartphone." },
  ];

  // Testimonials: regional > fallback
  const testimonials = content.testimonials?.length
    ? content.testimonials.map(t => ({ text: t.text, name: t.name, location: t.location }))
    : defaultTestimonials;

  // Dynamic vars for social proof
  const clientsCount = content.dynamic_vars?.clients_count || 1000;
  const avgRating = content.dynamic_vars?.average_rating || 4.8;

  // ─── Handlers ───
  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  const handlePropertyChoice = (choice: string) => {
    setSelectedProperty(choice);
    setWizardData(d => ({ ...d, propertyType: choice }));
    setTimeout(() => setWizardStep(2), 500);
  };

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
          if (cities.length === 1) setWizardData(d => ({ ...d, city: cities[0] }));
        }
      } catch { /* silent */ }
    }
  };

  const handleStep2Continue = () => {
    try {
      step2Schema.parse({ chauffage: wizardData.chauffage, surface: wizardData.surface, postalCode: wizardData.postalCode, city: wizardData.city });
      setTimeout(() => setWizardStep(3), 400);
    } catch (error) {
      if (error instanceof z.ZodError) toast.error(error.errors[0].message);
    }
  };

  const handleStep3Submit = async () => {
    try {
      step3Schema.parse({ lastName: wizardData.lastName, firstName: wizardData.firstName, email: wizardData.email, phone: wizardData.phone });
    } catch (error) {
      if (error instanceof z.ZodError) { toast.error(error.errors[0].message); return; }
    }
    setIsSubmitting(true);
    try {
      await supabase.from("leads").insert({
        first_name: wizardData.firstName, last_name: wizardData.lastName,
        phone: wizardData.phone, email: wizardData.email,
        postal_code: wizardData.postalCode, city: wizardData.city, address: "N/A",
        property_type: wizardData.propertyType, needs: ["panneaux-solaires"],
        notes: `Landing solaire ${isRegional ? regionName : "nationale"} | Chauffage: ${wizardData.chauffage} | Surface: ${wizardData.surface}`,
        status: "new",
      });
      const formConfigId = "058314de-16fc-4f17-bad3-fe51e3959109";
      await supabase.from("form_submissions").insert({
        form_id: formConfigId,
        data: { ...wizardData, region: regionCode },
        status: "new",
      });
      const params = new URLSearchParams({ name: `${wizardData.firstName} ${wizardData.lastName}`, workType: "panneaux-solaires" });
      navigate(`/merci?${params.toString()}`);
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressValue = wizardStep === 1 ? 10 : wizardStep === 2 ? 55 : 90;

  const dataFooter = (
    <p className="text-center text-xs text-muted-foreground mt-6">
      Vos données sont protégées. En savoir plus sur notre{" "}
      <Link to="/politique-confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>.
    </p>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Wizard renderer ───
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
          <p className="text-center text-sm text-muted-foreground mb-4">Vous êtes :</p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[{ key: "maison", icon: Home, label: "Propriétaire" }, { key: "locataire", icon: Building2, label: "Locataire" }].map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => handlePropertyChoice(key)}
                className={`flex flex-col items-center gap-3 p-6 border-2 rounded-xl transition-all cursor-pointer ${selectedProperty === key ? "border-primary bg-primary/10" : "border-border hover:border-primary hover:bg-primary/5"}`}>
                <Icon className="w-10 h-10 text-primary" />
                <span className="font-semibold text-foreground">{label}</span>
              </button>
            ))}
          </div>
          <Button size="lg" className="w-full text-white font-bold text-lg opacity-50 cursor-default" style={{ backgroundColor: '#5b7a5b' }} tabIndex={-1}>
            &gt; Continuer
          </Button>
          {dataFooter}
        </div>
      );
    }
    if (wizardStep === 2) {
      return (
        <div key="step2" className="animate-fade-in">
          <h3 className="text-xl font-bold text-center mb-2" style={{ color: '#5b7a5b' }}>Vérifier mon éligibilité à la prime énergie :</h3>
          <Progress value={progressValue} className="mb-6 h-3" />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-sm font-medium">Votre mode de chauffage principal: *</Label>
              <select value={wizardData.chauffage} onChange={(e) => setWizardData(d => ({ ...d, chauffage: e.target.value }))}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Sélectionner</option>
                {["Fioul", "Gaz", "Électricité", "Bois", "Pompe à chaleur", "Autre"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium">Surface de votre logement *</Label>
              <select value={wizardData.surface} onChange={(e) => setWizardData(d => ({ ...d, surface: e.target.value }))}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Sélectionner</option>
                {["<100m2", "100-150m2", "150-200m2", ">200m2"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="text-sm font-medium">Code postal *</Label>
              <Input placeholder="Code postal" value={wizardData.postalCode} onChange={handlePostalCodeChange} maxLength={5} className="mt-1 bg-background" />
            </div>
            <div>
              <Label className="text-sm font-medium">Ville *</Label>
              {citySuggestions.length > 1 ? (
                <select value={wizardData.city} onChange={(e) => setWizardData(d => ({ ...d, city: e.target.value }))}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Sélectionner</option>
                  {citySuggestions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <Input placeholder="Ville" value={wizardData.city} onChange={(e) => setWizardData(d => ({ ...d, city: e.target.value }))} className="mt-1 bg-background" />
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 bg-muted/60 text-muted-foreground font-semibold" onClick={() => setWizardStep(1)}>Retour</Button>
            <Button size="lg" className="flex-[2] text-white font-bold text-lg hover:opacity-90" style={{ backgroundColor: '#5b7a5b' }} onClick={handleStep2Continue}>&gt; Continuer</Button>
          </div>
          {dataFooter}
        </div>
      );
    }
    if (wizardStep === 3) {
      return (
        <div key="step3" className="animate-fade-in">
          <h3 className="text-xl font-bold text-center mb-2" style={{ color: '#5b7a5b' }}>Vérifier mon éligibilité à la prime énergie :</h3>
          <Progress value={progressValue} className="mb-6 h-3" />
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><Label className="text-sm font-medium">Nom *</Label><Input placeholder="Nom" value={wizardData.lastName} onChange={(e) => setWizardData(d => ({ ...d, lastName: e.target.value }))} className="mt-1 bg-background" /></div>
            <div><Label className="text-sm font-medium">Prénom *</Label><Input placeholder="Prénom" value={wizardData.firstName} onChange={(e) => setWizardData(d => ({ ...d, firstName: e.target.value }))} className="mt-1 bg-background" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div><Label className="text-sm font-medium">E-mail *</Label><Input type="email" placeholder="E-mail" value={wizardData.email} onChange={(e) => setWizardData(d => ({ ...d, email: e.target.value }))} className="mt-1 bg-background" /></div>
            <div><Label className="text-sm font-medium">Téléphone *</Label><Input type="tel" placeholder="Téléphone" value={wizardData.phone} onChange={(e) => setWizardData(d => ({ ...d, phone: e.target.value }))} className="mt-1 bg-background" /></div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 bg-muted/60 text-muted-foreground font-semibold" onClick={() => setWizardStep(2)}>Retour</Button>
            <Button size="lg" disabled={isSubmitting} className="flex-[2] text-white font-bold text-lg hover:opacity-90" style={{ backgroundColor: '#5b7a5b' }} onClick={handleStep3Submit}>
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
        <title>{seo.meta_title}</title>
        <meta name="description" content={seo.meta_description} />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        {shouldNoindex && <meta name="robots" content="noindex, nofollow" />}
      </Helmet>

      <LandingServiceSchema
        serviceName={seo.h1}
        regionName={regionName}
        description={seo.meta_description}
        url={canonicalUrl || `https://prime-energies.fr/landing/solaire/${regionCode}`}
        faq={content.faq}
      />

      <style>{`@keyframes bounce-step { 0% { transform: scale(0.97); opacity: 0.6; } 50% { transform: scale(1.02); } 100% { transform: scale(1); opacity: 1; } }`}</style>

      <div className="min-h-screen bg-background">
        <Header />
        <main>

          {/* ═══ SECTION 1: Hero Banner ═══ */}
          <section className="relative pt-24 pb-12 lg:pt-28 lg:pb-20 px-4 overflow-hidden">
            <img src={fondGris} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
            <div className="absolute inset-0 bg-background/30" aria-hidden="true" />
            <div className="container mx-auto max-w-7xl relative z-10">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-center mb-2" style={{ color: '#3d8b37' }}>
                {content.hero_title || seo.h1 || `Faites installer vos panneaux solaires${isRegional ? ` en ${regionName}` : ""}`}
              </h1>
              <p className="text-center text-base lg:text-lg text-foreground mb-8">
                {content.hero_subtitle || `Faites jusqu'à 70% d'économie sur 30 ans avec une centrale solaire en autoconsommation${isRegional ? ` en ${regionName}` : ""}.`}
              </p>
              <div className="grid lg:grid-cols-[1fr_1fr] gap-6 lg:gap-8 items-center">
                <SolarHeroVisual />
                <div ref={formRef} id="formulaire-solaire" className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-lg">
                  {renderWizardContent()}
                </div>
              </div>
            </div>
          </section>

          {/* ═══ SECTION 2: Contexte Local (regional only) ═══ */}
          {content.context && (
            <section className="py-10 lg:py-16 bg-gradient-to-b from-primary/5 to-background">
              <div className="container mx-auto px-4 max-w-6xl">
                <div className="mb-8">
                  <div className="inline-block w-16 h-1 bg-primary mb-4"></div>
                  <h2 className="text-2xl lg:text-4xl font-extrabold text-foreground leading-tight">
                    {content.context.title}
                  </h2>
                </div>
                <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-3xl">
                  {content.context.intro_text}
                </p>
                {content.context.highlights?.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {content.context.highlights.map((h: RegionalHighlight, i: number) => {
                      const IconComp = resolveIcon(h.icon);
                      return (
                        <div key={i} className="bg-card border border-border rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                            <IconComp className="w-6 h-6 text-primary" />
                          </div>
                          <p className="text-2xl font-extrabold text-foreground mb-1">{h.value}</p>
                          <p className="text-sm font-semibold text-primary mb-1">{h.label}</p>
                          <p className="text-xs text-muted-foreground">{h.description}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ═══ SECTION 3: Générer de l'électricité ═══ */}
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
                      investissement rentable grâce aux aides de l'État.
                      {simulatorData && ` Le tarif de rachat en ${regionName} est de ${simulatorData.tarif_rachat_0_3}€/kWh.`}
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

          {/* ═══ SECTION 4: Pourquoi l'énergie solaire ? ═══ */}
          <section className="py-10 lg:py-20 bg-card overflow-hidden">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-center mb-12">
                Pourquoi <span className="text-primary">l'énergie solaire{isRegional ? ` en ${regionName}` : ""} ?</span>
              </h2>
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

          {/* ═══ SECTION 5: Rentabilité locale ═══ */}
          {content.profitability && (
            <section className="py-10 lg:py-16 bg-muted">
              <div className="container mx-auto px-4 max-w-6xl">
                <div className="mb-8">
                  <div className="inline-block w-16 h-1 bg-primary mb-4"></div>
                  <h2 className="text-2xl lg:text-4xl font-extrabold text-foreground">{content.profitability.title}</h2>
                </div>
                <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-3xl">{content.profitability.intro_text}</p>
                
                {/* Key metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <p className="text-2xl font-extrabold text-primary">{content.profitability.roi_years} ans</p>
                    <p className="text-sm text-muted-foreground">Retour sur investissement</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <p className="text-2xl font-extrabold text-primary">{content.profitability.annual_production_kwh} kWh</p>
                    <p className="text-sm text-muted-foreground">Production/kWc/an</p>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 text-center">
                    <p className="text-2xl font-extrabold text-primary">{content.profitability.savings_25_years}</p>
                    <p className="text-sm text-muted-foreground">Économies sur 25 ans</p>
                  </div>
                  {simulatorData && (
                    <div className="bg-card border border-border rounded-xl p-4 text-center">
                      <p className="text-2xl font-extrabold text-primary">{simulatorData.tarif_kwh} €</p>
                      <p className="text-sm text-muted-foreground">Tarif kWh local</p>
                    </div>
                  )}
                </div>

                {/* Profitability table */}
                {content.profitability.table_data?.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full bg-card border border-border rounded-xl overflow-hidden">
                      <thead className="bg-primary/10">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Puissance</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Production annuelle</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Économies/an</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Amortissement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {content.profitability.table_data.map((row, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-4 py-3 text-sm font-medium text-foreground">{row.puissance}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{row.production}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-primary">{row.economies}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{row.amortissement}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ═══ SECTION 6: Aides & Subventions ═══ */}
          {content.aids && (
            <section className="py-10 lg:py-16 bg-card">
              <div className="container mx-auto px-4 max-w-6xl">
                <div className="mb-8">
                  <div className="inline-block w-16 h-1 bg-primary mb-4"></div>
                  <h2 className="text-2xl lg:text-4xl font-extrabold text-foreground">{content.aids.title}</h2>
                </div>
                {content.aids.intro_text && (
                  <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-3xl">{content.aids.intro_text}</p>
                )}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {content.aids.items.map((aid, i) => (
                    <div key={i} className="bg-muted border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-foreground">{aid.name}</h3>
                        {aid.is_local && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium flex-shrink-0 ml-2">
                            Aide locale
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-extrabold text-primary mb-2">{aid.amount}</p>
                      <p className="text-sm text-muted-foreground">{aid.description}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center mt-8">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-10" onClick={scrollToForm}>
                    Vérifier mes aides
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* ═══ SECTION 7: Critères d'éligibilité ═══ */}
          <section className="py-10 lg:py-16 bg-muted">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="text-center mb-2"><div className="inline-block w-16 h-1 bg-primary mb-4"></div></div>
              <h2 className="text-2xl lg:text-4xl font-extrabold mb-10 text-center lg:text-left">Quels sont les critères d'éligibilité?</h2>
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                  <div className="flex gap-6 justify-center lg:justify-start">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center"><Home className="w-7 h-7 text-primary" /></div>
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center"><Building2 className="w-7 h-7 text-primary" /></div>
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Pour pouvoir bénéficier de l'installation de panneaux solaires{isRegional ? ` en ${regionName}` : ""}, il vous faut respecter les critères d'éligibilité suivants:
                  </p>
                  <ul className="space-y-3 text-foreground">
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" /><span>Être propriétaire d'une maison individuelle.</span></li>
                    <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" /><span>Être relié aux fournisseur d'électricité</span></li>
                  </ul>
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary/5 font-semibold rounded-full px-8" onClick={scrollToForm}>Testez votre éligibilité</Button>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <img src={solarPanelsImg} alt="Famille heureuse avec panneaux solaires" className="w-full h-auto object-cover" />
                </div>
              </div>
            </div>
          </section>

          {/* ═══ SECTION 8: Notre prestation ═══ */}
          <section className="py-10 lg:py-16 bg-muted/50">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-2xl lg:text-4xl font-extrabold text-center mb-12">Notre prestation</h2>
              <div className="space-y-8">
                {[
                  { icon: Truck, text: `Primes-energies.fr vous aide à vérifier votre éligibilité à l'installation de panneaux solaires${isRegional ? ` en ${regionName}` : ""}. Cette installation peut être financée en partie grâce au programme de transition énergétique.` },
                  { icon: Wrench, text: "Nous nous occupons également de toutes les démarches administratives." },
                  { icon: Power, text: "Afin de savoir le montant de vos aides octroyés, vous pouvez effectuer un test d'éligibilité sur notre site." },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-5">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed pt-2">{item.text}</p>
                  </div>
                ))}
                <div className="flex justify-center pt-4">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-10" onClick={scrollToForm}>Testez votre éligibilité</Button>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ SECTION 9: Témoignages ═══ */}
          <section className="py-10 lg:py-16 bg-muted">
            <div className="container mx-auto px-4 max-w-6xl">
              <h2 className="text-2xl lg:text-4xl font-extrabold text-center mb-12">
                Déjà plus de <span className="text-primary">{clientsCount.toLocaleString("fr-FR")} clients</span> installés et satisfaits
                {avgRating && <span className="text-base font-normal text-muted-foreground ml-2">({avgRating}/5 ⭐)</span>}
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
                    {"location" in t && (t as { location?: string }).location && (
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <MapPin className="w-3 h-3" /> {(t as { location?: string }).location}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ SECTION 10: FAQ locale ═══ */}
          {content.faq && content.faq.length > 0 && (
            <section className="py-10 lg:py-16 bg-card">
              <div className="container mx-auto px-4 max-w-4xl">
                <h2 className="text-2xl lg:text-4xl font-extrabold text-center mb-12">
                  Questions fréquentes{isRegional ? ` — ${regionName}` : ""}
                </h2>
                <div className="space-y-4">
                  {content.faq.map((item, i) => (
                    <details key={i} className="bg-muted border border-border rounded-xl overflow-hidden group">
                      <summary className="px-6 py-4 font-semibold text-foreground cursor-pointer hover:bg-primary/5 transition-colors list-none flex items-center justify-between">
                        {item.question}
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="px-6 pb-4 text-sm text-muted-foreground leading-relaxed">
                        {item.answer}
                      </div>
                    </details>
                  ))}
                </div>
                <div className="flex justify-center mt-8">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-10" onClick={scrollToForm}>
                    Demandez votre devis gratuit
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* ═══ SECTION 11: Badges défilants ═══ */}
          <section className="py-10 lg:py-14 bg-background">
            <div className="container mx-auto px-4 max-w-5xl">
              <Carousel opts={{ align: "start", loop: true }} plugins={[Autoplay({ delay: 4000 })]} className="relative">
                <CarouselContent>
                  <CarouselItem className="basis-full">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center py-4">
                      {badges.slice(0, 4).map((badge, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-4 w-full flex items-center justify-center h-24 shadow-sm hover:shadow-md transition-shadow">
                          <span className={`text-sm md:text-base font-bold text-center ${badge.color}`}>{badge.name}</span>
                        </div>
                      ))}
                    </div>
                  </CarouselItem>
                  <CarouselItem className="basis-full">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center py-4">
                      {badges.slice(4).map((badge, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-4 w-full flex items-center justify-center h-24 shadow-sm hover:shadow-md transition-shadow">
                          <span className={`text-sm md:text-base font-bold text-center ${badge.color}`}>{badge.name}</span>
                        </div>
                      ))}
                    </div>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
            </div>
          </section>

          {/* ═══ SECTION 12: CTA final ═══ */}
          <section className="py-12 lg:py-16 bg-primary/5">
            <div className="container mx-auto px-4 max-w-3xl text-center">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-foreground mb-4">
                Prêt à passer au solaire{isRegional ? ` en ${regionName}` : ""} ?
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
      </div>
    </>
  );
};

// ─── Wrapper with Guard ───
const LandingSolaireRegionale = () => {
  const { region } = useParams<{ region: string }>();
  const regionCode = region || "fr";
  const slug = regionCode === "fr" ? "solaire" : `solaire-${regionCode}`;

  return (
    <LandingPageGuard slug={slug} fallbackSlug="solaire">
      <LandingSolaireRegionaleContent regionCode={regionCode} />
    </LandingPageGuard>
  );
};

export default LandingSolaireRegionale;
