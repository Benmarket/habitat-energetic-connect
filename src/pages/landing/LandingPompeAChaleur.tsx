import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Thermometer, ArrowRight } from "lucide-react";
import LandingPageGuard from "@/components/LandingPageGuard";
import { useLandingPageSEO } from "@/hooks/useLandingPageSEO";

const LandingPompeAChaleurContent = () => {
  const { seoStatus } = useLandingPageSEO("pompe-a-chaleur");

  return (
    <>
      <Helmet>
        <title>Installation Pompe à Chaleur | Prime Énergies</title>
        <meta name="description" content="Installez une pompe à chaleur performante et écologique. Chauffage et climatisation réversible avec des économies jusqu'à 75% sur vos factures." />
        {seoStatus === "hidden" && <meta name="robots" content="noindex, nofollow" />}
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="relative py-20 px-4 bg-gradient-to-br from-green-50 to-background">
            <div className="container mx-auto max-w-6xl">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-6">
                    <Thermometer className="w-4 h-4" />
                    <span className="font-semibold">Pompe à Chaleur</span>
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                    Chauffez votre maison de manière économique et écologique
                  </h1>
                  <p className="text-xl text-muted-foreground mb-8">
                    La pompe à chaleur divise vos factures de chauffage par 3 ou 4 tout en réduisant votre empreinte carbone.
                  </p>
                  <Button size="lg" className="gap-2">
                    Calculer mes économies
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="relative">
                  <img 
                    src="/placeholder.svg" 
                    alt="Pompe à chaleur" 
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
                Pourquoi installer une pompe à chaleur ?
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Thermometer className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Haute performance</h3>
                  <p className="text-muted-foreground">
                    Jusqu'à 75% d'économies sur vos factures de chauffage
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Thermometer className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Réversible</h3>
                  <p className="text-muted-foreground">
                    Chauffage en hiver et climatisation en été avec un seul appareil
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Thermometer className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Aides importantes</h3>
                  <p className="text-muted-foreground">
                    MaPrimeRénov' et CEE pour financer votre installation
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

const LandingPompeAChaleur = () => {
  return (
    <LandingPageGuard slug="pompe-a-chaleur">
      <LandingPompeAChaleurContent />
    </LandingPageGuard>
  );
};

export default LandingPompeAChaleur;
