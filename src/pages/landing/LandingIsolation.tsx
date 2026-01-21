import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Home, ArrowRight } from "lucide-react";
import LandingPageGuard from "@/components/LandingPageGuard";
import { useLandingPageSEO } from "@/hooks/useLandingPageSEO";

const LandingIsolationContent = () => {
  const { seoStatus } = useLandingPageSEO("isolation");

  return (
    <>
      <Helmet>
        <title>Isolation Thermique de votre Logement | Prime Énergies</title>
        <meta name="description" content="Améliorez le confort de votre maison avec une isolation thermique performante. Profitez des aides pour isoler vos combles, murs et planchers." />
        {seoStatus === "hidden" && <meta name="robots" content="noindex, nofollow" />}
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="relative py-20 px-4 bg-gradient-to-br from-blue-50 to-background">
            <div className="container mx-auto max-w-6xl">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full mb-6">
                    <Home className="w-4 h-4" />
                    <span className="font-semibold">Isolation Thermique</span>
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                    Isolez votre logement et économisez sur vos factures de chauffage
                  </h1>
                  <p className="text-xl text-muted-foreground mb-8">
                    Réduisez jusqu'à 30% vos déperditions thermiques grâce à une isolation performante de vos combles, murs et planchers.
                  </p>
                  <Button size="lg" className="gap-2">
                    Tester mon éligibilité
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="relative">
                  <img 
                    src="/placeholder.svg" 
                    alt="Isolation thermique" 
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
                Les avantages de l'isolation thermique
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Confort optimal</h3>
                  <p className="text-muted-foreground">
                    Maintenez une température agréable en toute saison
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Économies d'énergie</h3>
                  <p className="text-muted-foreground">
                    Réduisez significativement vos factures de chauffage
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Valorisation immobilière</h3>
                  <p className="text-muted-foreground">
                    Augmentez la valeur de votre bien immobilier
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

const LandingIsolation = () => {
  return (
    <LandingPageGuard slug="isolation">
      <LandingIsolationContent />
    </LandingPageGuard>
  );
};

export default LandingIsolation;
