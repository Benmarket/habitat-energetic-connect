import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Eye, FileText, Users, CalendarIcon, TrendingUp, TrendingDown } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";

interface RegionStatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regionCode: string;
  regionName: string;
}

interface PageViewStats {
  page_url: string;
  views: number;
}

interface DailyStats {
  date: string;
  views: number;
}

const RegionStatsModal = ({ open, onOpenChange, regionCode, regionName }: RegionStatsModalProps) => {
  const [loading, setLoading] = useState(true);
  const [totalViews, setTotalViews] = useState(0);
  const [uniqueVisitors, setUniqueVisitors] = useState(0);
  const [topPages, setTopPages] = useState<PageViewStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  useEffect(() => {
    if (open && regionCode) {
      fetchStats();
    }
  }, [open, regionCode, dateRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const fromDate = startOfDay(dateRange.from).toISOString();
      const toDate = endOfDay(dateRange.to).toISOString();

      // Fetch total views for the region
      const { data: viewsData, error: viewsError } = await supabase
        .from("page_views")
        .select("id, visitor_id, page_url, created_at")
        .eq("region_code", regionCode)
        .gte("created_at", fromDate)
        .lte("created_at", toDate);

      if (viewsError) throw viewsError;

      if (viewsData) {
        setTotalViews(viewsData.length);
        
        // Count unique visitors
        const uniqueVisitorIds = new Set(viewsData.map(v => v.visitor_id));
        setUniqueVisitors(uniqueVisitorIds.size);

        // Group by page URL for top pages
        const pageGroups: Record<string, number> = {};
        viewsData.forEach(view => {
          pageGroups[view.page_url] = (pageGroups[view.page_url] || 0) + 1;
        });
        
        const sortedPages = Object.entries(pageGroups)
          .map(([page_url, views]) => ({ page_url, views }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 10);
        
        setTopPages(sortedPages);

        // Group by date for daily stats
        const dateGroups: Record<string, number> = {};
        viewsData.forEach(view => {
          const date = format(new Date(view.created_at), "yyyy-MM-dd");
          dateGroups[date] = (dateGroups[date] || 0) + 1;
        });
        
        const sortedDates = Object.entries(dateGroups)
          .map(([date, views]) => ({ date, views }))
          .sort((a, b) => a.date.localeCompare(b.date));
        
        setDailyStats(sortedDates);
      }
    } catch (error) {
      console.error("Error fetching region stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const avgViewsPerDay = dailyStats.length > 0 
    ? Math.round(totalViews / dailyStats.length) 
    : 0;

  const trend = dailyStats.length >= 2
    ? dailyStats[dailyStats.length - 1].views - dailyStats[dailyStats.length - 2].views
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Statistiques - {regionName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Date Range Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.from, "dd MMM yyyy", { locale: fr })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => date && setDateRange({ ...dateRange, from: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">→</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.to, "dd MMM yyyy", { locale: fr })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => date && setDateRange({ ...dateRange, to: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {/* Quick filters */}
            <div className="flex gap-2 ml-auto">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}
              >
                7j
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}
              >
                30j
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setDateRange({ from: subDays(new Date(), 90), to: new Date() })}
              >
                90j
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des statistiques...
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground">Pages vues</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">{totalViews.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-medium text-muted-foreground">Visiteurs uniques</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">{uniqueVisitors.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium text-muted-foreground">Moy./jour</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{avgViewsPerDay}</div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {trend >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-xs font-medium text-muted-foreground">Tendance</span>
                    </div>
                    <div className={`text-2xl font-bold ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {trend >= 0 ? '+' : ''}{trend}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Chart (simplified bar chart) */}
              {dailyStats.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Évolution des vues</h3>
                  <div className="bg-muted/30 rounded-lg p-4 border">
                    <div className="flex items-end gap-1 h-32">
                      {dailyStats.slice(-14).map((day, index) => {
                        const maxViews = Math.max(...dailyStats.map(d => d.views));
                        const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-1">
                            <div 
                              className="w-full bg-primary/60 rounded-t transition-all hover:bg-primary"
                              style={{ height: `${height}%`, minHeight: day.views > 0 ? '4px' : '0' }}
                              title={`${format(new Date(day.date), "dd MMM", { locale: fr })}: ${day.views} vues`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>{format(new Date(dailyStats[Math.max(0, dailyStats.length - 14)].date), "dd MMM", { locale: fr })}</span>
                      <span>{format(new Date(dailyStats[dailyStats.length - 1].date), "dd MMM", { locale: fr })}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Pages */}
              {topPages.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Pages les plus consultées</h3>
                  <div className="space-y-2">
                    {topPages.map((page, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                            {index + 1}
                          </Badge>
                          <span className="font-medium text-sm truncate max-w-[300px]">
                            {page.page_url || "/"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                          <span className="font-bold">{page.views}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalViews === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune donnée pour cette période</p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegionStatsModal;
