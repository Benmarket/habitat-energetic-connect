import { Helmet } from "react-helmet";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sun, ArrowRight, Home, Plug, Quote, ChevronLeft, ChevronRight,
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

// ─── Band 4: Critères d'éligibilité image ───
import solarPanelsImg from "@/assets/solar-panels.jpg";

// ─── Form schema for Band 8 ───
const contactSchema = z.object({
  lastName: z.string().trim().min(1, "Le nom est requis"),
  firstName: z.string().trim().min(1, "Le prénom est requis"),
  phone: z.string().trim().min(10, "Téléphone invalide"),
  email: z.string().trim().email("Email invalide"),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Code postal invalide"),
  city: z.string().trim().min(1, "La ville est requise"),
});

// ─── Band 7: Badges data ───
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

// ─── Band 6: Testimonials data ───
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
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    lastName: "", firstName: "", phone: "", email: "", postalCode: "", city: "",
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const validated = contactSchema.parse(formData);
      const { error } = await supabase.from("leads").insert({
        first_name: validated.firstName,
        last_name: validated.lastName,
        phone: validated.phone,
        email: validated.email,
        postal_code: validated.postalCode,
        city: validated.city,
        address: "N/A",
        property_type: "maison",
        needs: ["panneaux-solaires"],
        notes: "Depuis landing page solaire",
        status: "new",
      });
      if (error) throw error;
      const params = new URLSearchParams({ 
        name: `${validated.firstName} ${validated.lastName}`,
        workType: "energie-solaire"
      });
      navigate(`/merci?${params.toString()}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Erreur lors de l'envoi");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Why solar benefits
  const benefits = [
    { image: ecologiqueImg, title: "Écologique", description: "L'énergie solaire utilise la lumière du soleil pour produire de l'électricité sans émission nocive." },
    { image: factureEdfImg, title: "Économique", description: "Votre installation solaire peut vous faire réaliser jusqu'à 70% d'économie sur votre facture d'électricité." },
    { image: smartphoneImg, title: "Maîtrise", description: "Maîtrisez votre consommation électrique en produisant votre propre énergie." },
    { image: appliPvImg, title: "Connecté", description: "Contrôlez la production de votre installation photovoltaïque depuis votre smartphone." },
  ];

  return (
    <>
      <Helmet>
        <title>Installation Panneaux Solaires Photovoltaïques | Prime Énergies</title>
        <meta name="description" content="Profitez des aides pour installer vos panneaux solaires photovoltaïques. Réduisez vos factures d'électricité et produisez votre propre énergie verte." />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        {seoStatus === "hidden" && <meta name="robots" content="noindex, nofollow" />}
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">

          {/* ═══ BAND 1: Hero Banner ═══ */}
          <section className="relative py-12 lg:py-20 px-4 bg-gradient-to-br from-muted via-background to-muted overflow-hidden">
            <div className="container mx-auto max-w-7xl">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-center mb-8 text-primary">
                Faites installer vos panneaux solaires
              </h1>
              
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                {/* Left: Product info */}
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                    <Sun className="w-4 h-4" />
                    Programme Exclusif
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <img src={guarantee25Years} alt="Garantie 25 ans" className="w-16 h-16 lg:w-20 lg:h-20" />
                    <div className="flex items-center gap-2 border-2 border-foreground/20 rounded-full px-4 py-2">
                      <span className="text-sm font-bold">🇫🇷 MARQUE FRANÇAISE</span>
                    </div>
                  </div>

                  <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4 inline-block">
                    <p className="text-sm text-muted-foreground">À partir de</p>
                    <p className="text-3xl font-extrabold text-primary">35 €/mois</p>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Seulement ! Primes déduites</p>
                  </div>

                  <div>
                    <h2 className="text-xl lg:text-2xl font-extrabold mb-2">Propriétaire d'une maison individuelle ?</h2>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Passez <strong className="text-foreground">à l'énergie solaire</strong> et faites d'importantes économies sur votre <strong className="text-foreground">facture électrique.</strong>
                    </p>
                  </div>
                </div>

                {/* Right: Eligibility mini-form */}
                <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-lg">
                  <h3 className="text-xl font-bold text-center mb-4">
                    Vérifier mon éligibilité à la prime énergie :
                  </h3>
                  <p className="text-center text-sm text-muted-foreground mb-6">
                    Testez votre éligibilité aux aides et subventions en <span className="underline font-medium">1 minute</span> sur notre site.
                  </p>
                  <Link to="/#eligibilite">
                    <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg gap-2">
                      &gt; Continuer
                    </Button>
                  </Link>
                  <p className="text-center text-xs text-muted-foreground mt-4">
                    Vos données sont protégées. En savoir plus sur notre{" "}
                    <Link to="/politique-confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ BAND 2: Générer de l'électricité (from homepage) ═══ */}
          <section className="py-10 lg:py-16 bg-gradient-to-b from-blue-50/30 to-background">
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
                          <div className="w-4 h-4 mt-1 rounded bg-orange-500 flex-shrink-0"></div>
                          <p className="text-sm text-foreground font-medium">Capter les rayons du soleil et les convertir en kW</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 mt-1 rounded bg-cyan-500 flex-shrink-0"></div>
                          <p className="text-sm text-foreground font-medium">Revente du surplus non consommé</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl font-semibold gap-2" asChild>
                      <a href="#formulaire-solaire">
                        Ça m'intéresse <ArrowRight className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ BAND 3: Pourquoi l'énergie solaire ? ═══ */}
          <section className="py-10 lg:py-20 bg-white overflow-hidden">
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
                  <CarouselPrevious className="opacity-60 hover:opacity-100 bg-white/90 hover:bg-white border-2" />
                  <CarouselNext className="opacity-60 hover:opacity-100 bg-white/90 hover:bg-white border-2" />
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
          <section className="py-10 lg:py-16 bg-muted">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="text-center mb-2">
                <div className="inline-block w-16 h-1 bg-primary mb-4"></div>
              </div>
              <h2 className="text-2xl lg:text-4xl font-extrabold mb-10 text-center lg:text-left">
                Quels sont les critères d'éligibilité?
              </h2>
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                  <div className="flex gap-6 justify-center lg:justify-start">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Home className="w-7 h-7 text-primary" />
                    </div>
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                      <Plug className="w-7 h-7 text-primary" />
                    </div>
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Pour pouvoir bénéficier de l'installation de panneaux solaires, il vous faut respecter les critères d'éligibilité suivants:
                  </p>
                  <ul className="space-y-3 text-foreground">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Être propriétaire d'une maison individuelle.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Être relié aux fournisseur d'électricité</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="border-primary text-primary hover:bg-primary/5 font-semibold rounded-full px-8" asChild>
                    <a href="#formulaire-solaire">Testez votre éligibilité</a>
                  </Button>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <img src={solarPanelsImg} alt="Famille heureuse avec panneaux solaires" className="w-full h-auto object-cover" />
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
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full px-10" asChild>
                    <a href="#formulaire-solaire">Testez votre éligibilité</a>
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
                          <span className={`text-sm md:text-base font-bold text-center ${badge.color}`}>{badge.name}</span>
                        </div>
                      ))}
                    </div>
                  </CarouselItem>
                  {/* Frame 2: badges 4-7 */}
                  <CarouselItem className="basis-full">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center justify-items-center py-4">
                      {badges.slice(4, 8).map((badge, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-4 w-full flex items-center justify-center h-24 shadow-sm hover:shadow-md transition-shadow">
                          <span className={`text-sm md:text-base font-bold text-center ${badge.color}`}>{badge.name}</span>
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

          {/* ═══ BAND 8: Formulaire de contact ═══ */}
          <section id="formulaire-solaire" className="py-10 lg:py-16 bg-muted/70">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-center mb-2">
                Installer mes panneaux solaires à la maison
              </h2>
              <p className="text-center text-orange-600 font-bold mb-8">
                Propriétaires de maison individuelle exclusivement
              </p>

              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-orange-600 font-semibold text-sm">Nom de famille *</Label>
                    <Input
                      placeholder="Nom de famille"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      className="bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-orange-600 font-semibold text-sm">Prénom *</Label>
                    <Input
                      placeholder="Prénom"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      className="bg-white mt-1"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-orange-600 font-semibold text-sm">Téléphone *</Label>
                    <Input
                      type="tel"
                      placeholder="Téléphone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-orange-600 font-semibold text-sm">E-mail *</Label>
                    <Input
                      type="email"
                      placeholder="Ex. email@exemple.fr"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="bg-white mt-1"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-orange-600 font-semibold text-sm">Code postal *</Label>
                    <Input
                      placeholder="Code postal"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      required
                      className="bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-orange-600 font-semibold text-sm">Ville *</Label>
                    <Input
                      placeholder="Ville"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      className="bg-white mt-1"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full px-10"
                  >
                    {isSubmitting ? "Envoi..." : "Envoyer"}
                  </Button>
                </div>
              </form>
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
