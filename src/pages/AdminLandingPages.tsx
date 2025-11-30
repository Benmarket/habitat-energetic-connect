import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Eye, Sun, Home, Thermometer, Building2, TrendingUp, FileText, Users, MousePointerClick } from "lucide-react";
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
    stats: {
      views: 1247,
      formSubmissions: 89,
      leads: 67,
      formStarts: 132,
    },
  },
  {
    id: "isolation",
    title: "Isolation Thermique",
    path: "/landing/isolation",
    description: "Isolation des combles, murs et planchers",
    icon: Home,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    stats: {
      views: 982,
      formSubmissions: 74,
      leads: 58,
      formStarts: 109,
    },
  },
  {
    id: "pompe-a-chaleur",
    title: "Pompe à Chaleur",
    path: "/landing/pompe-a-chaleur",
    description: "Installation de pompe à chaleur air/eau ou air/air",
    icon: Thermometer,
    color: "text-green-600",
    bgColor: "bg-green-100",
    stats: {
      views: 1534,
      formSubmissions: 112,
      leads: 89,
      formStarts: 178,
    },
  },
  {
    id: "renovation-globale",
    title: "Rénovation Globale",
    path: "/landing/renovation-globale",
    description: "Projet de rénovation énergétique d'ampleur",
    icon: Building2,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    stats: {
      views: 876,
      formSubmissions: 52,
      leads: 41,
      formStarts: 87,
    },
  },
];

const AdminLandingPages = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [previewLanding, setPreviewLanding] = useState<typeof landingPages[0] | null>(null);
  const [selectedLanding, setSelectedLanding] = useState<typeof landingPages[0] | null>(null);

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

  const handleCardClick = (landing: typeof landingPages[0]) => {
    setSelectedLanding(landing);
  };

  const handlePreview = (e: React.MouseEvent, landing: typeof landingPages[0]) => {
    e.stopPropagation();
    setPreviewLanding(landing);
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
              const conversionRate = ((landing.stats.leads / landing.stats.views) * 100).toFixed(1);
              
              return (
                <Card 
                  key={landing.id} 
                  className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => handleCardClick(landing)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg ${landing.bgColor} flex items-center justify-center flex-shrink-0`}>
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
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">URL:</span>
                        <code className="px-2 py-1 bg-muted rounded text-xs">
                          {landing.path}
                        </code>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Vues</p>
                            <p className="text-lg font-bold">{landing.stats.views}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                            <Users className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Leads</p>
                            <p className="text-lg font-bold">{landing.stats.leads}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                            <MousePointerClick className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Début form</p>
                            <p className="text-lg font-bold">{landing.stats.formStarts}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                            <FileText className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Formulaires</p>
                            <p className="text-lg font-bold">{landing.stats.formSubmissions}</p>
                          </div>
                        </div>
                      </div>

                      {/* Conversion Rate */}
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Taux de conversion</span>
                          <span className="text-lg font-bold text-primary">{conversionRate}%</span>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handlePreview(e, landing)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Prévisualiser
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Preview Modal */}
          <Dialog open={!!previewLanding} onOpenChange={() => setPreviewLanding(null)}>
            <DialogContent className="max-w-6xl h-[90vh] p-0">
              <DialogHeader className="px-6 py-4 border-b">
                <DialogTitle className="flex items-center gap-3">
                  {previewLanding && (
                    <>
                      <div className={`w-10 h-10 rounded-lg ${previewLanding.bgColor} flex items-center justify-center`}>
                        {(() => {
                          const Icon = previewLanding.icon;
                          return <Icon className={`w-5 h-5 ${previewLanding.color}`} />;
                        })()}
                      </div>
                      <span>Prévisualisation - {previewLanding.title}</span>
                    </>
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden">
                {previewLanding && (
                  <iframe
                    src={previewLanding.path}
                    className="w-full h-full"
                    title={`Preview ${previewLanding.title}`}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Stats Modal */}
          <Dialog open={!!selectedLanding} onOpenChange={() => setSelectedLanding(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selectedLanding && (
                    <>
                      <div className={`w-10 h-10 rounded-lg ${selectedLanding.bgColor} flex items-center justify-center`}>
                        {(() => {
                          const Icon = selectedLanding.icon;
                          return <Icon className={`w-5 h-5 ${selectedLanding.color}`} />;
                        })()}
                      </div>
                      <span>Statistiques - {selectedLanding.title}</span>
                    </>
                  )}
                </DialogTitle>
              </DialogHeader>
              {selectedLanding && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Vues totales</p>
                            <p className="text-2xl font-bold">{selectedLanding.stats.views}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Leads générés</p>
                            <p className="text-2xl font-bold">{selectedLanding.stats.leads}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <MousePointerClick className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Débuts de formulaire</p>
                            <p className="text-2xl font-bold">{selectedLanding.stats.formStarts}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Formulaires soumis</p>
                            <p className="text-2xl font-bold">{selectedLanding.stats.formSubmissions}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            Taux de conversion global
                          </p>
                          <p className="text-xs text-muted-foreground">
                            (Leads / Vues totales)
                          </p>
                        </div>
                        <p className="text-4xl font-bold text-primary">
                          {((selectedLanding.stats.leads / selectedLanding.stats.views) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Taux d'abandon formulaire</span>
                          <span className="font-semibold">
                            {(((selectedLanding.stats.formStarts - selectedLanding.stats.formSubmissions) / selectedLanding.stats.formStarts) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Taux de qualification</span>
                          <span className="font-semibold">
                            {((selectedLanding.stats.leads / selectedLanding.stats.formSubmissions) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AdminLandingPages;