import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, Sun, Home, Thermometer, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const landingPages = [
  {
    id: "solaire",
    title: "Solaire Photovoltaïque",
    path: "/landing/solaire",
    description: "Installation de panneaux solaires pour production d'électricité",
    icon: Sun,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  {
    id: "isolation",
    title: "Isolation Thermique",
    path: "/landing/isolation",
    description: "Isolation des combles, murs et planchers",
    icon: Home,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    id: "pompe-a-chaleur",
    title: "Pompe à Chaleur",
    path: "/landing/pompe-a-chaleur",
    description: "Installation de pompe à chaleur air/eau ou air/air",
    icon: Thermometer,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    id: "renovation-globale",
    title: "Rénovation Globale",
    path: "/landing/renovation-globale",
    description: "Projet de rénovation énergétique d'ampleur",
    icon: Building2,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
];

const AdminLandingPages = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    navigate("/connexion");
    return null;
  }

  const handleViewLanding = (path: string) => {
    window.open(path, "_blank");
  };

  return (
    <>
      <Helmet>
        <title>Gestion des Landing Pages | Prime Énergies</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8 mt-16">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/administration")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'administration
            </Button>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Gestion des Landing Pages</h1>
            <p className="text-muted-foreground">
              Gérez vos pages de destination pour chaque type de projet énergétique
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {landingPages.map((landing) => {
              const Icon = landing.icon;
              return (
                <Card key={landing.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg ${landing.bgColor} flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${landing.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{landing.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {landing.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">URL:</span>
                        <code className="px-2 py-1 bg-muted rounded text-xs">
                          {landing.path}
                        </code>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewLanding(landing.path)}
                          className="gap-2 flex-1"
                        >
                          <Eye className="w-4 h-4" />
                          Visualiser
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AdminLandingPages;