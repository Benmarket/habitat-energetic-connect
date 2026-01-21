import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Eye, Sun, Home, Thermometer, Building2, TrendingUp, FileText, Users, MousePointerClick, EyeOff, Ban, Globe, Clock, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sun,
  Home,
  Thermometer,
  Building2,
};

type LandingPage = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  path: string;
  icon: string;
  color: string;
  bg_color: string;
  seo_status: "seo" | "hidden" | "disabled";
  seo_status_changed_at: string | null;
  created_at: string;
  updated_at: string;
};

// Helper function to calculate deindexation estimate
const getDeindexationEstimate = (landing: LandingPage) => {
  if (landing.seo_status === "seo") return null;
  
  const changedAt = landing.seo_status_changed_at 
    ? new Date(landing.seo_status_changed_at) 
    : new Date(landing.updated_at);
  const now = new Date();
  const daysSinceChange = Math.floor((now.getTime() - changedAt.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceChange < 7) {
    return {
      status: "pending" as const,
      text: `Dé-indexation en cours (~${7 - daysSinceChange} jours restants)`,
      shortText: `~${7 - daysSinceChange}j`,
      icon: Loader2,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    };
  } else if (daysSinceChange < 28) {
    return {
      status: "processing" as const,
      text: `En cours de dé-indexation par Google (jour ${daysSinceChange}/28)`,
      shortText: `${daysSinceChange}j`,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    };
  } else {
    return {
      status: "complete" as const,
      text: `Probablement dé-indexée (${daysSinceChange} jours)`,
      shortText: "OK",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    };
  }
};

const AdminLandingPages = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [previewLanding, setPreviewLanding] = useState<LandingPage | null>(null);
  const [selectedLanding, setSelectedLanding] = useState<LandingPage | null>(null);

  // Fetch landing pages from database
  const { data: landingPages = [], isLoading } = useQuery({
    queryKey: ["landing-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_pages")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as LandingPage[];
    },
  });

  // Mutation to update SEO status
  const updateSeoStatusMutation = useMutation({
    mutationFn: async ({ id, seo_status }: { id: string; seo_status: "seo" | "hidden" | "disabled" }) => {
      const { error } = await supabase
        .from("landing_pages")
        .update({ seo_status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
      toast.success("Statut SEO mis à jour");
    },
    onError: (error) => {
      console.error("Error updating SEO status:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  if (authLoading || isLoading) {
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

  const handleCardClick = (landing: LandingPage) => {
    setSelectedLanding(landing);
  };

  const handlePreview = (e: React.MouseEvent, landing: LandingPage) => {
    e.stopPropagation();
    if (landing.seo_status === "disabled") {
      toast.error("Cette page est désactivée et non accessible");
      return;
    }
    setPreviewLanding(landing);
  };

  const getSeoStatusBadge = (status: "seo" | "hidden" | "disabled") => {
    switch (status) {
      case "seo":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1">
            <Globe className="w-3 h-3" />
            SEO
          </Badge>
        );
      case "hidden":
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 gap-1">
            <EyeOff className="w-3 h-3" />
            Masquée
          </Badge>
        );
      case "disabled":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 gap-1">
            <Ban className="w-3 h-3" />
            Désactivée
          </Badge>
        );
    }
  };

  const getSeoStatusDescription = (status: "seo" | "hidden" | "disabled") => {
    switch (status) {
      case "seo":
        return "Page indexée par les moteurs de recherche";
      case "hidden":
        return "Page accessible uniquement via URL directe";
      case "disabled":
        return "Page désactivée, redirige vers 404";
    }
  };

  // Mock stats for now - can be connected to real analytics later
  const mockStats: Record<string, { views: number; formSubmissions: number; leads: number; formStarts: number }> = {
    solaire: { views: 1247, formSubmissions: 89, leads: 67, formStarts: 132 },
    isolation: { views: 982, formSubmissions: 74, leads: 58, formStarts: 109 },
    "pompe-a-chaleur": { views: 1534, formSubmissions: 112, leads: 89, formStarts: 178 },
    "renovation-globale": { views: 876, formSubmissions: 52, leads: 41, formStarts: 87 },
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
              Gérez vos pages de destination et leur visibilité SEO
            </p>
          </div>

          {/* Legend */}
          <div className="mb-6 flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1">
                <Globe className="w-3 h-3" />
                SEO
              </Badge>
              <span className="text-sm text-muted-foreground">Indexée et visible</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 gap-1">
                <EyeOff className="w-3 h-3" />
                Masquée
              </Badge>
              <span className="text-sm text-muted-foreground">Accessible via URL uniquement</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800 hover:bg-red-100 gap-1">
                <Ban className="w-3 h-3" />
                Désactivée
              </Badge>
              <span className="text-sm text-muted-foreground">Redirige vers 404</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {landingPages.map((landing) => {
              const Icon = iconMap[landing.icon] || Sun;
              const stats = mockStats[landing.slug] || { views: 0, formSubmissions: 0, leads: 0, formStarts: 0 };
              const conversionRate = stats.views > 0 ? ((stats.leads / stats.views) * 100).toFixed(1) : "0.0";
              
              return (
                <Card 
                  key={landing.id} 
                  className={`hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50 relative ${
                    landing.seo_status === "disabled" ? "opacity-60" : ""
                  }`}
                  onClick={() => handleCardClick(landing)}
                >
                  {/* External Link Button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={landing.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-3 right-3 p-2 rounded-lg bg-muted/80 hover:bg-primary hover:text-primary-foreground transition-colors z-10"
                          aria-label={`Ouvrir ${landing.title} dans un nouvel onglet`}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Ouvrir dans un nouvel onglet</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg ${landing.bg_color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-6 h-6 ${landing.color}`} />
                        </div>
                        <div className="pr-8">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-xl">{landing.title}</CardTitle>
                            {getSeoStatusBadge(landing.seo_status)}
                          </div>
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

                      {/* SEO Status Selector */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-sm font-medium">Statut:</span>
                        <Select
                          value={landing.seo_status}
                          onValueChange={(value: "seo" | "hidden" | "disabled") => {
                            updateSeoStatusMutation.mutate({ id: landing.id, seo_status: value });
                          }}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="seo">
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-green-600" />
                                SEO (indexée)
                              </div>
                            </SelectItem>
                            <SelectItem value="hidden">
                              <div className="flex items-center gap-2">
                                <EyeOff className="w-4 h-4 text-orange-600" />
                                Masquée
                              </div>
                            </SelectItem>
                            <SelectItem value="disabled">
                              <div className="flex items-center gap-2">
                                <Ban className="w-4 h-4 text-red-600" />
                                Désactivée
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {getSeoStatusDescription(landing.seo_status)}
                        </p>
                        
                        {/* Deindexation Indicator */}
                        {(() => {
                          const estimate = getDeindexationEstimate(landing);
                          if (!estimate) return null;
                          
                          const IconComponent = estimate.icon;
                          
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${estimate.bgColor} cursor-help`}>
                                    <IconComponent className={`w-3 h-3 ${estimate.color} ${estimate.status === 'pending' ? 'animate-spin' : ''}`} />
                                    <span className={`text-xs font-medium ${estimate.color}`}>
                                      {estimate.shortText}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-xs">
                                  <p className="text-sm">{estimate.text}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Google met généralement 1 à 4 semaines pour dé-indexer une page.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })()}
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Vues</p>
                            <p className="text-lg font-bold">{stats.views}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                            <Users className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Leads</p>
                            <p className="text-lg font-bold">{stats.leads}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                            <MousePointerClick className="w-4 h-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Début form</p>
                            <p className="text-lg font-bold">{stats.formStarts}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                            <FileText className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Formulaires</p>
                            <p className="text-lg font-bold">{stats.formSubmissions}</p>
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
                        disabled={landing.seo_status === "disabled"}
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
                      <div className={`w-10 h-10 rounded-lg ${previewLanding.bg_color} flex items-center justify-center`}>
                        {(() => {
                          const Icon = iconMap[previewLanding.icon] || Sun;
                          return <Icon className={`w-5 h-5 ${previewLanding.color}`} />;
                        })()}
                      </div>
                      <span>Prévisualisation - {previewLanding.title}</span>
                      {getSeoStatusBadge(previewLanding.seo_status)}
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
                      <div className={`w-10 h-10 rounded-lg ${selectedLanding.bg_color} flex items-center justify-center`}>
                        {(() => {
                          const Icon = iconMap[selectedLanding.icon] || Sun;
                          return <Icon className={`w-5 h-5 ${selectedLanding.color}`} />;
                        })()}
                      </div>
                      <span>Statistiques - {selectedLanding.title}</span>
                      {getSeoStatusBadge(selectedLanding.seo_status)}
                    </>
                  )}
                </DialogTitle>
              </DialogHeader>
              {selectedLanding && (() => {
                const stats = mockStats[selectedLanding.slug] || { views: 0, formSubmissions: 0, leads: 0, formStarts: 0 };
                return (
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
                              <p className="text-2xl font-bold">{stats.views}</p>
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
                              <p className="text-2xl font-bold">{stats.leads}</p>
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
                              <p className="text-2xl font-bold">{stats.formStarts}</p>
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
                              <p className="text-2xl font-bold">{stats.formSubmissions}</p>
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
                            {stats.views > 0 ? ((stats.leads / stats.views) * 100).toFixed(1) : "0.0"}%
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
                              {stats.formStarts > 0 
                                ? (((stats.formStarts - stats.formSubmissions) / stats.formStarts) * 100).toFixed(1)
                                : "0.0"}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Taux de qualification</span>
                            <span className="font-semibold">
                              {stats.formSubmissions > 0
                                ? ((stats.leads / stats.formSubmissions) * 100).toFixed(1)
                                : "0.0"}%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
            </DialogContent>
          </Dialog>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AdminLandingPages;
