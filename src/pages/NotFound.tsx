import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { Home, Search, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  // 404 pages are normal - no need to log

  return (
    <>
      <Helmet>
        <title>Page introuvable - 404 | Prime Énergies</title>
        <meta name="description" content="La page que vous recherchez n'existe pas ou a été déplacée." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        
        <main className="flex-1 flex items-start justify-center px-4 pt-32 pb-16">
          <div className="text-center max-w-2xl mx-auto">
            <div className="mb-8">
              <FileQuestion className="w-24 h-24 mx-auto text-primary opacity-50" />
            </div>
            
            <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
            <p className="text-2xl font-semibold text-foreground mb-4">
              Page introuvable
            </p>
            <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
              Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <Button size="lg" className="gap-2">
                  <Home className="w-5 h-5" />
                  Retour à l'accueil
                </Button>
              </Link>
              <Link to="/actualites">
                <Button variant="outline" size="lg" className="gap-2">
                  <Search className="w-5 h-5" />
                  Voir les actualités
                </Button>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default NotFound;
