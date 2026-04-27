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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ArrowLeft, Eye, Sun, Home, Thermometer, Building2, TrendingUp, FileText, 
  Users, MousePointerClick, EyeOff, Ban, Globe, Clock, CheckCircle, Loader2, 
  ExternalLink, Layers, Hash, Newspaper, BookOpen, HandCoins, HelpCircle,
  MessageCircle, Calculator, FileCheck, Anchor, Link2, ChevronDown, ChevronRight,
  MapPin, Zap, ImageIcon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RegionalContentEditor from "@/components/RegionalContentEditor";
import LandingPageSectionsEditor from "@/components/LandingPageSectionsEditor";
import type { RegionalContent } from "@/hooks/useRegionalContent";
import { Pencil } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sun, Home, Thermometer, Building2,
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
  parent_id: string | null;
  region_code: string | null;
  regional_content: RegionalContent | null;
  variant_slug: string | null;
  level: string;
};

// Site pages configuration with anchors
const SITE_PAGES = [
  { 
    id: "home", title: "Accueil", path: "/", icon: Home, 
    color: "text-primary", bgColor: "bg-primary/10",
    description: "Page d'accueil du site",
    anchors: [
      { id: "hero", label: "Hero / En-tête", path: "/#hero" },
      { id: "simulateurs", label: "Simulateurs", path: "/#simulateurs" },
      { id: "aides", label: "Aides", path: "/#aides" },
      { id: "installateurs", label: "Trouver un installateur", path: "/#installateurs" },
      { id: "pourquoi-solaire", label: "Pourquoi le solaire", path: "/#pourquoi-solaire" },
      { id: "actualites", label: "Actualités", path: "/#actualites" },
      { id: "guides", label: "Guides", path: "/#guides" },
      { id: "avis", label: "Avis clients", path: "/#avis" },
    ]
  },
  { id: "actualites", title: "Actualités", path: "/actualites", icon: Newspaper, color: "text-sky-600", bgColor: "bg-sky-100", description: "Articles d'actualités", anchors: [] },
  { id: "guides", title: "Guides", path: "/guides", icon: BookOpen, color: "text-indigo-600", bgColor: "bg-indigo-100", description: "Guides pratiques", anchors: [] },
  { id: "aides", title: "Aides", path: "/aides", icon: HandCoins, color: "text-emerald-600", bgColor: "bg-emerald-100", description: "Aides et subventions", anchors: [] },
  { id: "forum", title: "Forum", path: "/forum", icon: MessageCircle, color: "text-orange-600", bgColor: "bg-orange-100", description: "Forum communautaire", anchors: [] },
  { id: "faq", title: "FAQ", path: "/faq", icon: HelpCircle, color: "text-purple-600", bgColor: "bg-purple-100", description: "Questions fréquentes", anchors: [] },
  { id: "simulateur-solaire", title: "Simulateur Solaire", path: "/simulateurs/solaire", icon: Calculator, color: "text-amber-600", bgColor: "bg-amber-100", description: "Simulateur d'économies solaires", anchors: [] },
];

type SectionTab = "landing-pages" | "site-pages" | "anchors";

const getDeindexationEstimate = (landing: LandingPage) => {
  if (landing.seo_status === "seo") return null;
  const changedAt = landing.seo_status_changed_at ? new Date(landing.seo_status_changed_at) : new Date(landing.updated_at);
  const now = new Date();
  const daysSinceChange = Math.floor((now.getTime() - changedAt.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceChange < 7) {
    return { status: "pending" as const, text: `Dé-indexation en cours (~${7 - daysSinceChange} jours restants)`, shortText: `~${7 - daysSinceChange}j`, icon: Loader2, color: "text-orange-600", bgColor: "bg-orange-100" };
  } else if (daysSinceChange < 28) {
    return { status: "processing" as const, text: `En cours de dé-indexation par Google (jour ${daysSinceChange}/28)`, shortText: `${daysSinceChange}j`, icon: Clock, color: "text-yellow-600", bgColor: "bg-yellow-100" };
  } else {
    return { status: "complete" as const, text: `Probablement dé-indexée (${daysSinceChange} jours)`, shortText: "OK", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100" };
  }
};

const mockLandingStats: Record<string, { views: number; formSubmissions: number; leads: number; formStarts: number }> = {
  solaire: { views: 1247, formSubmissions: 89, leads: 67, formStarts: 132 },
  isolation: { views: 982, formSubmissions: 74, leads: 58, formStarts: 109 },
  "pompe-a-chaleur": { views: 1534, formSubmissions: 112, leads: 89, formStarts: 178 },
  "renovation-globale": { views: 876, formSubmissions: 52, leads: 41, formStarts: 87 },
};

const mockPageStats: Record<string, { views: number; clicks: number }> = {
  home: { views: 15420, clicks: 4230 },
  actualites: { views: 3450, clicks: 890 },
  guides: { views: 2780, clicks: 720 },
  aides: { views: 4120, clicks: 1340 },
  forum: { views: 1890, clicks: 560 },
  faq: { views: 980, clicks: 230 },
  "simulateur-solaire": { views: 2340, clicks: 670 },
};

const mockAnchorStats: Record<string, { clicks: number }> = {
  hero: { clicks: 2340 }, simulateurs: { clicks: 1890 }, aides: { clicks: 1456 },
  installateurs: { clicks: 3210 }, "pourquoi-solaire": { clicks: 890 },
  actualites: { clicks: 670 }, guides: { clicks: 540 }, avis: { clicks: 780 },
};

const regionLabels: Record<string, string> = {
  fr: "Métropole", corse: "Corse", reunion: "Réunion",
  martinique: "Martinique", guadeloupe: "Guadeloupe", guyane: "Guyane",
};

const variantLabels: Record<string, string> = {
  "panneaux-photovoltaiques": "Panneaux Photovoltaïques",
  "photovoltaique-batterie": "Photovoltaïque + Batterie",
};

// SEO status mini badge
const SeoMicroBadge = ({ status }: { status: "seo" | "hidden" | "disabled" }) => {
  if (status === "seo") return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-700"><Globe className="w-2.5 h-2.5" />SEO</span>;
  if (status === "hidden") return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700"><EyeOff className="w-2.5 h-2.5" />Masquée</span>;
  return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700"><Ban className="w-2.5 h-2.5" />Off</span>;
};

const AdminPagesAnchors = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SectionTab>("landing-pages");
  const [previewLanding, setPreviewLanding] = useState<LandingPage | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [editingRegional, setEditingRegional] = useState<LandingPage | null>(null);
  const [editingSections, setEditingSections] = useState<LandingPage | null>(null);

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

  const updateSeoStatusMutation = useMutation({
    mutationFn: async ({ id, seo_status }: { id: string; seo_status: "seo" | "hidden" | "disabled" }) => {
      const { error } = await supabase.from("landing_pages").update({ seo_status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-pages"] });
      toast.success("Statut SEO mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  if (authLoading || isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }
  if (!user) { navigate("/connexion"); return null; }

  // Build hierarchy
  const productPages = landingPages.filter(lp => lp.level === "product");
  const getChildren = (parentId: string) => landingPages.filter(lp => lp.parent_id === parentId);

  const toggleProduct = (id: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleRegion = (id: string) => {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getSeoStatusBadge = (status: "seo" | "hidden" | "disabled") => {
    switch (status) {
      case "seo": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1"><Globe className="w-3 h-3" />SEO</Badge>;
      case "hidden": return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 gap-1"><EyeOff className="w-3 h-3" />Masquée</Badge>;
      case "disabled": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 gap-1"><Ban className="w-3 h-3" />Désactivée</Badge>;
    }
  };

  const SeoStatusSelect = ({ landing }: { landing: LandingPage }) => (
    <Select
      value={landing.seo_status}
      onValueChange={(value: "seo" | "hidden" | "disabled") => {
        updateSeoStatusMutation.mutate({ id: landing.id, seo_status: value });
      }}
    >
      <SelectTrigger className="w-[160px] h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="seo"><div className="flex items-center gap-2"><Globe className="w-3 h-3 text-green-600" />SEO (indexée)</div></SelectItem>
        <SelectItem value="hidden"><div className="flex items-center gap-2"><EyeOff className="w-3 h-3 text-orange-600" />Masquée</div></SelectItem>
        <SelectItem value="disabled"><div className="flex items-center gap-2"><Ban className="w-3 h-3 text-red-600" />Désactivée</div></SelectItem>
      </SelectContent>
    </Select>
  );

  const TABS = [
    { id: "landing-pages" as SectionTab, label: "Landing Pages", icon: FileText, count: landingPages.length },
    { id: "site-pages" as SectionTab, label: "Pages du site", icon: Layers, count: SITE_PAGES.length },
    { id: "anchors" as SectionTab, label: "Ancres", icon: Anchor, count: SITE_PAGES.reduce((acc, p) => acc + p.anchors.length, 0) },
  ];

  const allAnchors = SITE_PAGES.flatMap(page => 
    page.anchors.map(anchor => ({ ...anchor, pageName: page.title, pageIcon: page.icon, pageColor: page.color, pageBgColor: page.bgColor }))
  );

  return (
    <>
      <Helmet>
        <title>Gestion des Pages et Ancres | Prime Énergies</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8 mt-16">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate("/administration")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Retour à l'administration
            </Button>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Gestion des Pages et Ancres</h1>
            <p className="text-muted-foreground">Gérez vos landing pages, les pages du site et les ancres de navigation</p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 p-1 bg-muted/50 rounded-xl">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${isActive ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:text-foreground hover:bg-background/50"}`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <Badge variant="secondary" className={`ml-1 ${isActive ? "bg-primary/10 text-primary" : ""}`}>{tab.count}</Badge>
                </button>
              );
            })}
          </div>

          {/* Landing Pages Section */}
          {activeTab === "landing-pages" && (
            <div className="space-y-6 animate-fade-in">
              {/* Legend */}
              <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 gap-1"><Globe className="w-3 h-3" />SEO</Badge>
                  <span className="text-sm text-muted-foreground">Indexée et visible</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 gap-1"><EyeOff className="w-3 h-3" />Masquée</Badge>
                  <span className="text-sm text-muted-foreground">Accessible via URL uniquement</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100 gap-1"><Ban className="w-3 h-3" />Désactivée</Badge>
                  <span className="text-sm text-muted-foreground">Redirige vers 404</span>
                </div>
              </div>

              {/* Product Cards (Drawers) */}
              <div className="grid gap-6 md:grid-cols-2">
                {productPages.map((product) => {
                  const Icon = iconMap[product.icon] || Sun;
                  const stats = mockLandingStats[product.slug] || { views: 0, formSubmissions: 0, leads: 0, formStarts: 0 };
                  const regionChildren = getChildren(product.id).filter(c => c.level === "region");
                  const isExpanded = expandedProducts.has(product.id);
                  const totalChildren = regionChildren.length + regionChildren.reduce((acc, r) => acc + getChildren(r.id).length, 0);
                  
                  return (
                    <Card 
                      key={product.id} 
                      className={`relative transition-all ${product.seo_status === "disabled" ? "opacity-60" : ""} ${isExpanded ? "ring-2 ring-primary/20" : "hover:shadow-lg"}`}
                    >
                      <TooltipProvider>
                        <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingSections(product); }}
                                className="p-2 rounded-lg bg-muted/80 hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="left"><p>Éditer les sections</p></TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a
                                href={product.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 rounded-lg bg-muted/80 hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </TooltipTrigger>
                            <TooltipContent side="left"><p>Ouvrir dans un nouvel onglet</p></TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>

                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-lg ${product.bg_color} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-6 h-6 ${product.color}`} />
                          </div>
                          <div className="flex-1 pr-8">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <CardTitle className="text-lg">{product.title}</CardTitle>
                              {getSeoStatusBadge(product.seo_status)}
                            </div>
                            <CardDescription>{product.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium">URL:</span>
                          <code className="px-2 py-1 bg-muted rounded text-xs">{product.path}</code>
                        </div>

                        {/* SEO Status Selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Statut:</span>
                          <SeoStatusSelect landing={product} />
                          {(() => {
                            const estimate = getDeindexationEstimate(product);
                            if (!estimate) return null;
                            const IconComp = estimate.icon;
                            return (
                              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${estimate.bgColor} cursor-help`}>
                                  <IconComp className={`w-3 h-3 ${estimate.color} ${estimate.status === 'pending' ? 'animate-spin' : ''}`} />
                                  <span className={`text-xs font-medium ${estimate.color}`}>{estimate.shortText}</span>
                                </div>
                              </TooltipTrigger><TooltipContent side="bottom" className="max-w-xs"><p className="text-sm">{estimate.text}</p></TooltipContent></Tooltip></TooltipProvider>
                            );
                          })()}
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center"><TrendingUp className="w-4 h-4 text-blue-600" /></div>
                            <div><p className="text-xs text-muted-foreground">Vues</p><p className="text-lg font-bold">{stats.views.toLocaleString()}</p></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center"><Users className="w-4 h-4 text-green-600" /></div>
                            <div><p className="text-xs text-muted-foreground">Leads</p><p className="text-lg font-bold">{stats.leads}</p></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center"><MousePointerClick className="w-4 h-4 text-orange-600" /></div>
                            <div><p className="text-xs text-muted-foreground">Début form</p><p className="text-lg font-bold">{stats.formStarts}</p></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center"><FileCheck className="w-4 h-4 text-purple-600" /></div>
                            <div><p className="text-xs text-muted-foreground">Formulaires</p><p className="text-lg font-bold">{stats.formSubmissions}</p></div>
                          </div>
                        </div>

                        {/* Expand Drawer Button */}
                        {totalChildren > 0 && (
                          <div className="pt-2 border-t">
                            <button
                              onClick={() => toggleProduct(product.id)}
                              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/60 hover:bg-muted transition-colors text-sm font-medium"
                            >
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-primary" />
                                <span>{totalChildren} landing page{totalChildren > 1 ? "s" : ""} régionale{totalChildren > 1 ? "s" : ""}</span>
                              </div>
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>

                            {/* Expanded Region Tree */}
                            {isExpanded && (
                              <div className="mt-3 space-y-2 animate-fade-in">
                                {regionChildren.map((region) => {
                                  const variantChildren = getChildren(region.id);
                                  const isRegionExpanded = expandedRegions.has(region.id);
                                  const regionName = regionLabels[region.region_code || ""] || region.region_code || "";

                                  return (
                                    <div key={region.id} className="rounded-lg border bg-background">
                                      {/* Region Header */}
                                      <div className="flex items-center gap-2 px-3 py-2">
                                        {variantChildren.length > 0 ? (
                                          <button onClick={() => toggleRegion(region.id)} className="p-0.5 rounded hover:bg-muted transition-colors">
                                            {isRegionExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                          </button>
                                        ) : <div className="w-4.5" />}
                                        
                                        <MapPin className="w-3.5 h-3.5 text-primary" />
                                        <span className="font-medium text-sm flex-1">{regionName}</span>
                                        <code className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground hidden sm:inline">{region.path}</code>
                                        <SeoMicroBadge status={region.seo_status} />
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button onClick={() => setEditingSections(region)} className="p-1 rounded hover:bg-muted transition-colors">
                                              <ImageIcon className="w-3.5 h-3.5 text-muted-foreground hover:text-amber-600" />
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent>Gérer les sections (images hero...)</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button onClick={() => setEditingRegional(region)} className="p-1 rounded hover:bg-muted transition-colors">
                                              <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent>Éditer le contenu régional</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <button onClick={() => setPreviewLanding(region)} className="p-1 rounded hover:bg-muted transition-colors">
                                              <Eye className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                                            </button>
                                          </TooltipTrigger>
                                          <TooltipContent>Prévisualiser</TooltipContent>
                                        </Tooltip>
                                        <SeoStatusSelect landing={region} />
                                      </div>

                                      {/* Variant Children */}
                                      {isRegionExpanded && variantChildren.length > 0 && (
                                        <div className="border-t bg-muted/30 divide-y">
                                          {variantChildren.map((variant) => (
                                            <div key={variant.id} className="flex items-center gap-2 px-3 py-2 pl-10">
                                              <Zap className="w-3 h-3 text-amber-500" />
                                              <span className="text-sm flex-1">
                                                {variantLabels[variant.variant_slug || ""] || variant.variant_slug}
                                              </span>
                                              <code className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground hidden sm:inline">{variant.path}</code>
                                              <SeoMicroBadge status={variant.seo_status} />
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <button onClick={() => setEditingRegional(variant)} className="p-1 rounded hover:bg-muted transition-colors">
                                                    <Pencil className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                                                  </button>
                                                </TooltipTrigger>
                                                <TooltipContent>Éditer le contenu</TooltipContent>
                                              </Tooltip>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <button onClick={() => setPreviewLanding(variant)} className="p-1 rounded hover:bg-muted transition-colors">
                                                    <Eye className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                                                  </button>
                                                </TooltipTrigger>
                                                <TooltipContent>Prévisualiser</TooltipContent>
                                              </Tooltip>
                                              <SeoStatusSelect landing={variant} />
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Preview (only if no children or as additional action) */}
                        {totalChildren === 0 && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline" size="sm" className="flex-1"
                              onClick={(e) => { e.stopPropagation(); if (product.seo_status !== "disabled") setPreviewLanding(product); else toast.error("Page désactivée"); }}
                              disabled={product.seo_status === "disabled"}
                            >
                              <Eye className="w-4 h-4 mr-2" />Prévisualiser
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Site Pages Section */}
          {activeTab === "site-pages" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {SITE_PAGES.map((page) => {
                  const Icon = page.icon;
                  const stats = mockPageStats[page.id] || { views: 0, clicks: 0 };
                  return (
                    <Card key={page.id} className="hover:shadow-lg transition-all relative group">
                      <TooltipProvider><Tooltip><TooltipTrigger asChild>
                        <a href={page.path} target="_blank" rel="noopener noreferrer" className="absolute top-3 right-3 p-2 rounded-lg bg-muted/80 hover:bg-primary hover:text-primary-foreground transition-colors z-10 opacity-0 group-hover:opacity-100">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </TooltipTrigger><TooltipContent side="left"><p>Ouvrir dans un nouvel onglet</p></TooltipContent></Tooltip></TooltipProvider>
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg ${page.bgColor} flex items-center justify-center`}><Icon className={`w-5 h-5 ${page.color}`} /></div>
                          <div className="flex-1"><CardTitle className="text-base">{page.title}</CardTitle><CardDescription className="text-xs mt-1">{page.description}</CardDescription></div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <code className="px-2 py-1 bg-muted rounded">{page.path}</code>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><Globe className="w-3 h-3 mr-1" />Active</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-blue-100 rounded flex items-center justify-center"><TrendingUp className="w-3.5 h-3.5 text-blue-600" /></div>
                            <div><p className="text-[10px] text-muted-foreground">Vues</p><p className="text-sm font-bold">{stats.views.toLocaleString()}</p></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-orange-100 rounded flex items-center justify-center"><MousePointerClick className="w-3.5 h-3.5 text-orange-600" /></div>
                            <div><p className="text-[10px] text-muted-foreground">Clics</p><p className="text-sm font-bold">{stats.clicks.toLocaleString()}</p></div>
                          </div>
                        </div>
                        {page.anchors.length > 0 && (
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Anchor className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{page.anchors.length} ancre{page.anchors.length > 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Anchors Section */}
          {activeTab === "anchors" && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Les ancres permettent de créer des liens directs vers des sections spécifiques de vos pages.</p>
              </div>
              <div className="grid gap-3">
                {allAnchors.map((anchor) => {
                  const PageIcon = anchor.pageIcon;
                  const stats = mockAnchorStats[anchor.id] || { clicks: 0 };
                  return (
                    <Card key={anchor.id} className="hover:shadow-md transition-all">
                      <CardContent className="py-4 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg ${anchor.pageBgColor} flex items-center justify-center flex-shrink-0`}><PageIcon className={`w-5 h-5 ${anchor.pageColor}`} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{anchor.label}</h3>
                            <Badge variant="secondary" className="text-xs">{anchor.pageName}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground">{anchor.path}</code>
                            <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => { navigator.clipboard.writeText(anchor.path); toast.success("Lien copié !"); }}>
                              <Link2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center"><MousePointerClick className="w-4 h-4 text-orange-600" /></div>
                            <div className="text-right"><p className="text-xs text-muted-foreground">Clics</p><p className="font-bold">{stats.clicks.toLocaleString()}</p></div>
                          </div>
                          <TooltipProvider><Tooltip><TooltipTrigger asChild>
                            <a href={anchor.path} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"><ExternalLink className="w-4 h-4" /></a>
                          </TooltipTrigger><TooltipContent><p>Tester l'ancre</p></TooltipContent></Tooltip></TooltipProvider>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {allAnchors.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground"><Anchor className="w-12 h-12 mx-auto mb-4 opacity-20" /><p>Aucune ancre configurée</p></div>
                )}
              </div>
            </div>
          )}
        </main>
        <Footer />

        {/* Preview Modal */}
        <Dialog open={!!previewLanding} onOpenChange={() => setPreviewLanding(null)}>
          <DialogContent className="max-w-6xl h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Eye className="w-5 h-5" />Prévisualisation: {previewLanding?.title}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 h-full min-h-0">
              {previewLanding && <iframe src={previewLanding.path} className="w-full h-full rounded-lg border" title={`Prévisualisation de ${previewLanding.title}`} />}
            </div>
          </DialogContent>
        </Dialog>
        {/* Regional Content Editor */}
        {editingRegional && (
          <RegionalContentEditor
            open={!!editingRegional}
            onOpenChange={(open) => !open && setEditingRegional(null)}
            landingPageId={editingRegional.id}
            landingPageSlug={editingRegional.slug}
            regionName={regionLabels[editingRegional.region_code || ""] || editingRegional.region_code || ""}
            regionCode={editingRegional.region_code || ""}
            initialContent={(editingRegional.regional_content || {}) as RegionalContent}
            parentContent={
              editingRegional.parent_id
                ? (landingPages.find(lp => lp.id === editingRegional.parent_id)?.regional_content as RegionalContent | null) || null
                : null
            }
            variantSlug={editingRegional.variant_slug}
            pagePath={editingRegional.path}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ["landing-pages"] })}
          />
        )}
        {/* Landing Page Sections Editor */}
        {editingSections && (
          <LandingPageSectionsEditor
            open={!!editingSections}
            onOpenChange={(open) => !open && setEditingSections(null)}
            landingPage={editingSections}
            parentContent={
              editingSections.parent_id
                ? (landingPages.find(lp => lp.id === editingSections.parent_id)?.regional_content as RegionalContent | null) || null
                : null
            }
            onSaved={() => queryClient.invalidateQueries({ queryKey: ["landing-pages"] })}
          />
        )}
      </div>
    </>
  );
};

export default AdminPagesAnchors;
