import { useState, useEffect } from "react";
import { MapPin, Eye, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";
import RegionStatsModal from "./RegionStatsModal";

interface RegionData {
  code: string;
  name: string;
  views: number;
  trend: number;
}

const REGIONS: Record<string, string> = {
  "fr": "France métropolitaine",
  "corse": "Corse",
  "guadeloupe": "Guadeloupe",
  "martinique": "Martinique",
  "guyane": "Guyane",
  "reunion": "La Réunion",
};

const RegionsStatsBlock = () => {
  const [regionsData, setRegionsData] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<{ code: string; name: string } | null>(null);

  useEffect(() => {
    fetchRegionsStats();
  }, []);

  const fetchRegionsStats = async () => {
    setLoading(true);
    try {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const sixtyDaysAgo = subDays(new Date(), 60).toISOString();

      // Fetch views for last 30 days
      const { data: recentData, error: recentError } = await supabase
        .from("page_views")
        .select("region_code")
        .gte("created_at", thirtyDaysAgo);

      if (recentError) throw recentError;

      // Fetch views for 30-60 days ago (for trend)
      const { data: previousData, error: previousError } = await supabase
        .from("page_views")
        .select("region_code")
        .gte("created_at", sixtyDaysAgo)
        .lt("created_at", thirtyDaysAgo);

      if (previousError) throw previousError;

      // Count views per region
      const recentCounts: Record<string, number> = {};
      const previousCounts: Record<string, number> = {};

      recentData?.forEach(view => {
        recentCounts[view.region_code] = (recentCounts[view.region_code] || 0) + 1;
      });

      previousData?.forEach(view => {
        previousCounts[view.region_code] = (previousCounts[view.region_code] || 0) + 1;
      });

      // Build regions data with trends
      const regions: RegionData[] = Object.entries(REGIONS).map(([code, name]) => {
        const currentViews = recentCounts[code] || 0;
        const previousViews = previousCounts[code] || 0;
        const trend = previousViews > 0 
          ? Math.round(((currentViews - previousViews) / previousViews) * 100) 
          : (currentViews > 0 ? 100 : 0);
        
        return { code, name, views: currentViews, trend };
      });

      // Sort by views (descending)
      regions.sort((a, b) => b.views - a.views);
      setRegionsData(regions);
    } catch (error) {
      console.error("Error fetching regions stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalViews = regionsData.reduce((sum, r) => sum + r.views, 0);

  return (
    <>
      <RegionStatsModal 
        open={selectedRegion !== null}
        onOpenChange={(open) => !open && setSelectedRegion(null)}
        regionCode={selectedRegion?.code || ""}
        regionName={selectedRegion?.name || ""}
      />

      <div className="mt-6">
        <h3 className="font-semibold mb-4 text-base md:text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Trafic par Région
          <Badge variant="secondary" className="ml-2">30 derniers jours</Badge>
        </h3>
        
        <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg p-4 border">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">
              Chargement...
            </div>
          ) : (
            <div className="space-y-2">
              {regionsData.map((region) => {
                const percentage = totalViews > 0 ? (region.views / totalViews) * 100 : 0;
                
                return (
                  <div 
                    key={region.code}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/60 hover:bg-background/90 transition-colors cursor-pointer group"
                    onClick={() => setSelectedRegion({ code: region.code, name: region.name })}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-24 sm:w-32 font-medium text-sm truncate">
                        {region.name}
                      </div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden hidden sm:block">
                        <div 
                          className="h-full bg-primary/60 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        <span className="font-bold text-sm">{region.views.toLocaleString()}</span>
                      </div>
                      
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          region.trend > 0 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : region.trend < 0 
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {region.trend > 0 ? '+' : ''}{region.trend}%
                      </Badge>
                      
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && totalViews === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Les données de trafic par région seront disponibles après les premières visites.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RegionsStatsBlock;
