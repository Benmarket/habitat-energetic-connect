import { useEffect } from "react";
import { Loader2, Home } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Sitemap = () => {
  useEffect(() => {
    // Redirect to the edge function sitemap
    const sitemapUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sitemap`;
    window.location.href = sitemapUrl;
  }, []);

  return (
    <>
      <Header />
      
      <div className="flex min-h-screen items-center justify-center bg-background py-20">
        <div className="text-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8 font-medium"
          >
            <Home className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground text-lg">Génération du sitemap...</p>
            <p className="text-sm text-muted-foreground">Vous allez être redirigé automatiquement</p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Sitemap;
