import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Eye, Users, FileText, UserPlus, Download, Megaphone, Mail, Navigation, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageDetailsModal from "./PageDetailsModal";
import LiveVisitorsModal from "./LiveVisitorsModal";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";

const TrafficDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState("11");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [showLiveVisitors, setShowLiveVisitors] = useState(false);
  const { liveCount } = useOnlinePresence();

  const months = [
    { value: "1", label: "Jan." },
    { value: "2", label: "Fév." },
    { value: "3", label: "Mar." },
    { value: "4", label: "Avr." },
    { value: "5", label: "Mai" },
    { value: "6", label: "Juin" },
    { value: "7", label: "Juil." },
    { value: "8", label: "Août" },
    { value: "9", label: "Sep." },
    { value: "10", label: "Oct." },
    { value: "11", label: "Nov." },
    { value: "12", label: "Déc." }
  ];

  const years = ["2023", "2024", "2025"];

  // Données factices pour SEO et Trafic
  const topPages = [
    { url: "/", views: 350, avgTime: "1m32s", bounce: "38%" },
    { url: "/actualites", views: 287, avgTime: "1m48s", bounce: "35%" },
    { url: "/guides", views: 215, avgTime: "2m10s", bounce: "34%" },
    { url: "/aides", views: 202, avgTime: "1m05s", bounce: "41%" },
    { url: "/annonces", views: 178, avgTime: "1m15s", bounce: "39%" },
    { url: "/offres", views: 154, avgTime: "0m54s", bounce: "47%" },
    { url: "/forum", views: 143, avgTime: "2m35s", bounce: "28%" }
  ];

  const seoScore = 84;

  // Données factices pour Statistiques d'inventaire
  const inventoryStats = [
    { 
      label: "Nouvelles simulations", 
      value: 31, 
      trend: "+3%", 
      trendUp: true, 
      icon: Navigation,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    { 
      label: "Leads", 
      value: 22, 
      trend: "+5%", 
      trendUp: true, 
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    { 
      label: "Newsletter", 
      value: 22, 
      trend: "+21 inscrits, -12 désabo", 
      trendUp: true, 
      icon: Mail,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    { 
      label: "Nouveaux articles", 
      value: 14, 
      trend: "+8%", 
      trendUp: true, 
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    { 
      label: "Nouveaux utilisateurs", 
      value: 23, 
      trend: "+5%", 
      trendUp: true, 
      icon: UserPlus,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    },
    { 
      label: "Téléchargements de guides", 
      value: 41, 
      trend: "+3%", 
      trendUp: true, 
      icon: Download,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    { 
      label: "Nouvelles annonces", 
      value: 4, 
      trend: "+33%", 
      trendUp: true, 
      icon: Megaphone,
      color: "text-pink-600",
      bgColor: "bg-pink-50"
    },
    { 
      label: "Téléchargement de l'App Prime énergies", 
      value: 127, 
      trend: "+18%", 
      trendUp: true, 
      icon: Smartphone,
      color: "text-primary",
      bgColor: "bg-primary/10"
    }
  ];

  const getBounceColor = (bounce: string) => {
    const rate = parseInt(bounce);
    if (rate <= 35) return "text-emerald-600";
    if (rate <= 45) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <>
      <PageDetailsModal 
        open={selectedPage !== null} 
        onOpenChange={(open) => !open && setSelectedPage(null)}
        pageUrl={selectedPage || ""}
      />
      
      <LiveVisitorsModal 
        open={showLiveVisitors}
        onOpenChange={setShowLiveVisitors}
      />
      
      <div className="space-y-6">
      {/* Section 1: SEO et Trafic */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <div className="space-y-4">
            <div>
              <CardTitle className="text-xl md:text-2xl">Trafic et SEO</CardTitle>
              <CardDescription className="text-sm">Aperçu en direct, pages les plus visitées et santé SEO</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full sm:w-[120px] rounded-full border-2 border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full sm:w-[110px] rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div 
                className="text-center cursor-pointer hover:bg-primary/5 p-3 rounded-lg transition-colors w-full sm:w-auto"
                onClick={() => setShowLiveVisitors(true)}
              >
                <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground mb-1">
                  <Eye className="w-4 h-4" />
                  Visiteurs en direct
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-primary">{liveCount}</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pages les plus visitées */}
            <div>
              <h3 className="font-semibold mb-4 text-base md:text-lg">Pages les plus visitées</h3>
              <div className="space-y-2 md:space-y-3">
                {topPages.map((page, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedPage(page.url)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{page.url}</div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 text-sm">
                      <div className="text-center sm:text-right">
                        <div className="font-bold text-foreground">{page.views}</div>
                        <div className="text-xs text-muted-foreground">vues</div>
                      </div>
                      <div className="text-center sm:text-right hidden sm:block">
                        <div className="text-muted-foreground">{page.avgTime}</div>
                        <div className="text-xs text-muted-foreground">temps moy.</div>
                      </div>
                      <div className="text-center sm:text-right min-w-[50px]">
                        <div className={`font-semibold ${getBounceColor(page.bounce)}`}>{page.bounce}</div>
                        <div className="text-xs text-muted-foreground">bounce</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rapport SEO */}
            <div>
              <h3 className="font-semibold mb-4 text-base md:text-lg">Rapport SEO (synthèse)</h3>
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4 md:p-6 border border-primary/20">
                <div className="text-center mb-4 md:mb-6">
                  <div className="text-5xl md:text-6xl font-bold text-primary mb-2">{seoScore}</div>
                  <div className="text-sm text-muted-foreground">/ 100</div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-md bg-background/60">
                    <span className="text-sm font-medium">Meta OK</span>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      ✓ Validé
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-md bg-background/60">
                    <span className="text-sm font-medium">Liens 3xx</span>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      ⚠ 3 liens
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-md bg-background/60">
                    <span className="text-sm font-medium">Alt manquants</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      ✗ 12 images
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-primary/20 text-center">
                  <button className="text-sm text-primary hover:underline font-medium">
                    Voir l'audit complet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Statistiques d'inventaire */}
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <div>
            <CardTitle className="text-xl md:text-2xl">Vue d'ensemble</CardTitle>
            <CardDescription className="text-sm">Statistiques synthétiques pour {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {inventoryStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={index}
                  className="group relative p-6 rounded-xl border-2 bg-card hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${stat.trendUp ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                    >
                      {stat.trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {stat.trend}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>

                  {/* Mini sparkline simulation */}
                  <div className="mt-4 flex items-end h-8 gap-1">
                    {[...Array(12)].map((_, i) => {
                      const height = Math.random() * 100;
                      return (
                        <div 
                          key={i} 
                          className={`flex-1 rounded-t ${stat.bgColor} opacity-60`}
                          style={{ height: `${height}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
};

export default TrafficDashboard;
