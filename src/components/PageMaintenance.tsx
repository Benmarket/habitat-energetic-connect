import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { Helmet } from "react-helmet";

interface PageMaintenanceProps {
  pageName: string;
  description?: string;
}

export const PageMaintenance = ({ pageName, description }: PageMaintenanceProps) => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>{pageName} - En maintenance | Prime Énergies</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-muted/30 to-background pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="border-dashed border-2 border-amber-300 bg-amber-50/50">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
                  <Construction className="w-10 h-10 text-amber-600" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-4">
                  {pageName} - En maintenance
                </h1>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  {description || `Cette page est actuellement en cours de maintenance. Nous travaillons pour vous offrir une meilleure expérience. Veuillez réessayer ultérieurement.`}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                  <Button onClick={() => navigate("/")}>
                    Retour à l'accueil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};
