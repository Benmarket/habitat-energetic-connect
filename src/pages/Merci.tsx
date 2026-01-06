import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { CheckCircle2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet";

const Merci = () => {
  return (
    <>
      <Helmet>
        <title>Merci - Prime-Energies</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Merci !
            </h1>
            
            <p className="text-muted-foreground mb-8">
              Votre demande a bien été prise en compte. Nous vous recontacterons dans les plus brefs délais.
            </p>
            
            <Button asChild size="lg">
              <Link to="/" className="inline-flex items-center gap-2">
                <Home className="w-4 h-4" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Merci;
