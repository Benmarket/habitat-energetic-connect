import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Sun, ArrowRight } from "lucide-react";
import LandingPageGuard from "@/components/LandingPageGuard";
import { useLandingPageSEO } from "@/hooks/useLandingPageSEO";

const LandingSolaireContent = () => {
  const { seoStatus } = useLandingPageSEO("solaire");
  
  return (
    <>
      <Helmet>
        <title>Installation Panneaux Solaires Photovoltaïques | Prime Énergies</title>
        <meta name="description" content="Profitez des aides pour installer vos panneaux solaires photovoltaïques. Réduisez vos factures d'électricité et produisez votre propre énergie verte." />
        {seoStatus === "hidden" && <meta name="robots" content="noindex, nofollow" />}
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="relative py-20 px-4 bg-gradient-to-br from-orange-50 to-background">
            <div className="container mx-auto max-w-6xl">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full mb-6">
                    <Sun className="w-4 h-4" />
                    <span className="font-semibold">Énergie Solaire</span>
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                    Installez vos panneaux solaires et produisez votre propre électricité
                  </h1>
                  <p className="text-xl text-muted-foreground mb-8">
                    Réduisez jusqu'à 70% de vos factures d'électricité grâce aux aides de l'État et à la production solaire.
                  </p>
                  <Button size="lg" className="gap-2">
                    Estimer mes économies
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="relative">
                  <img 
                    src="/placeholder.svg" 
                    alt="Panneaux solaires" 
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
                Pourquoi choisir le solaire photovoltaïque ?
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sun className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Économies durables</h3>
                  <p className="text-muted-foreground">
                    Réduisez vos factures d'électricité de manière significative
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sun className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Énergie propre</h3>
                  <p className="text-muted-foreground">
                    Contribuez à la transition énergétique et réduisez votre empreinte carbone
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sun className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Aides financières</h3>
                  <p className="text-muted-foreground">
                    Bénéficiez des primes et aides de l'État pour votre installation
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

const LandingSolaire = () => {
  return (
    <LandingPageGuard slug="solaire">
      <LandingSolaireContent />
    </LandingPageGuard>
  );
};

export default LandingSolaire;
