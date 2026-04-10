import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight } from "lucide-react";
import LandingPageGuard from "@/components/LandingPageGuard";
import { useLandingPageSEO } from "@/hooks/useLandingPageSEO";

const LandingRenovationGlobaleContent = () => {
  const { seoStatus, canonicalUrl } = useLandingPageSEO("renovation-globale");

  return (
    <>
      <Helmet>
        <title>Rénovation Globale d'Ampleur | Prime Énergies</title>
        <meta name="description" content="Rénovez votre logement en profondeur avec un projet de rénovation globale. Aides renforcées pour un gain énergétique minimum de 55%." />
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        {seoStatus === "hidden" && <meta name="robots" content="noindex, nofollow" />}
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main>
          {/* Hero Section */}
          <section className="relative pt-24 pb-12 lg:pt-28 lg:pb-20 px-4 bg-gradient-to-br from-purple-50 to-background">
            <div className="container mx-auto max-w-6xl">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full mb-6">
                    <Building2 className="w-4 h-4" />
                    <span className="font-semibold">Rénovation d'Ampleur</span>
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                    Transformez votre logement avec une rénovation globale
                  </h1>
                  <p className="text-xl text-muted-foreground mb-8">
                    Bénéficiez d'aides renforcées pour une rénovation énergétique complète : isolation, chauffage, ventilation et plus encore.
                  </p>
                  <Button size="lg" className="gap-2">
                    Découvrir mes aides
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="relative">
                  <img 
                    src="/placeholder.svg" 
                    alt="Rénovation globale" 
                    className="rounded-lg shadow-2xl"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-20 px-4">
            <div className="container mx-auto max-w-6xl">
              <h2 className="text-3xl font-bold text-center mb-12">
                Les avantages d'une rénovation globale
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Aides majorées</h3>
                  <p className="text-muted-foreground">
                    Jusqu'à 90% de financement pour les ménages modestes
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Performance garantie</h3>
                  <p className="text-muted-foreground">
                    Gain énergétique minimum de 55% après travaux
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Accompagnement complet</h3>
                  <p className="text-muted-foreground">
                    Mon Accompagnateur Rénov' obligatoire pour vous guider
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

const LandingRenovationGlobale = () => {
  return (
    <LandingPageGuard slug="renovation-globale">
      <LandingRenovationGlobaleContent />
    </LandingPageGuard>
  );
};

export default LandingRenovationGlobale;
