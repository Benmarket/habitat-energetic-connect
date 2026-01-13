import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { Eye, MousePointerClick, UserCheck, TrendingUp, MapPin } from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";

interface AdStatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advertisement: {
    id: string;
    title: string;
    views_count: number;
    clicks_count: number;
    conversions_count: number;
  } | null;
}

interface RegionStats {
  region_code: string;
  region_name: string;
  views: number;
  clicks: number;
  conversions: number;
}

interface DailyStats {
  date: string;
  views: number;
  clicks: number;
  conversions: number;
}

const REGION_NAMES: Record<string, string> = {
  "FR": "France métropolitaine",
  "GP": "Guadeloupe",
  "MQ": "Martinique",
  "GF": "Guyane",
  "RE": "La Réunion",
  "CO": "Corse",
  "": "Non spécifié",
};

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const chartConfig = {
  views: {
    label: "Vues",
    color: "hsl(var(--chart-1))",
  },
  clicks: {
    label: "Clics",
    color: "hsl(var(--chart-2))",
  },
  conversions: {
    label: "Conversions",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export default function AdStatsModal({
  open,
  onOpenChange,
  advertisement,
}: AdStatsModalProps) {
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && advertisement) {
      fetchStats();
    }
  }, [open, advertisement]);

  const fetchStats = async () => {
    if (!advertisement) return;
    setLoading(true);

    try {
      // Fetch region stats
      const { data: regionData, error: regionError } = await supabase
        .from("ad_analytics")
        .select("region_code, event_type")
        .eq("advertisement_id", advertisement.id);

      if (regionError) throw regionError;

      // Process region stats
      const regionMap = new Map<string, RegionStats>();
      regionData?.forEach((row) => {
        const regionCode = row.region_code || "";
        if (!regionMap.has(regionCode)) {
          regionMap.set(regionCode, {
            region_code: regionCode,
            region_name: REGION_NAMES[regionCode] || regionCode,
            views: 0,
            clicks: 0,
            conversions: 0,
          });
        }
        const stats = regionMap.get(regionCode)!;
        if (row.event_type === "view") stats.views++;
        else if (row.event_type === "click") stats.clicks++;
        else if (row.event_type === "conversion") stats.conversions++;
      });
      setRegionStats(Array.from(regionMap.values()).sort((a, b) => b.views - a.views));

      // Fetch daily stats for last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30);
      const { data: dailyData, error: dailyError } = await supabase
        .from("ad_analytics")
        .select("created_at, event_type")
        .eq("advertisement_id", advertisement.id)
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (dailyError) throw dailyError;

      // Generate all days in range
      const days = eachDayOfInterval({
        start: thirtyDaysAgo,
        end: new Date(),
      });

      const dailyMap = new Map<string, DailyStats>();
      days.forEach((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        dailyMap.set(dateKey, {
          date: format(day, "dd MMM", { locale: fr }),
          views: 0,
          clicks: 0,
          conversions: 0,
        });
      });

      dailyData?.forEach((row) => {
        const dateKey = format(new Date(row.created_at), "yyyy-MM-dd");
        const stats = dailyMap.get(dateKey);
        if (stats) {
          if (row.event_type === "view") stats.views++;
          else if (row.event_type === "click") stats.clicks++;
          else if (row.event_type === "conversion") stats.conversions++;
        }
      });

      setDailyStats(Array.from(dailyMap.values()));
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!advertisement) return null;

  const conversionRate = advertisement.views_count > 0
    ? ((advertisement.conversions_count / advertisement.views_count) * 100).toFixed(1)
    : "0";

  const clickRate = advertisement.views_count > 0
    ? ((advertisement.clicks_count / advertisement.views_count) * 100).toFixed(1)
    : "0";

  const pieData = regionStats
    .filter((r) => r.views > 0)
    .map((r) => ({
      name: r.region_name,
      value: r.views,
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Statistiques : {advertisement.title}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Vues</span>
                  </div>
                  <p className="text-2xl font-bold">{advertisement.views_count}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MousePointerClick className="w-4 h-4" />
                    <span className="text-sm">Clics</span>
                  </div>
                  <p className="text-2xl font-bold">{advertisement.clicks_count}</p>
                  <p className="text-xs text-muted-foreground">Taux: {clickRate}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <UserCheck className="w-4 h-4" />
                    <span className="text-sm">Conversions</span>
                  </div>
                  <p className="text-2xl font-bold">{advertisement.conversions_count}</p>
                  <p className="text-xs text-muted-foreground">Taux: {conversionRate}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Régions</span>
                  </div>
                  <p className="text-2xl font-bold">{regionStats.length}</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="evolution" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="evolution">Évolution</TabsTrigger>
                <TabsTrigger value="regions">Par région</TabsTrigger>
                <TabsTrigger value="details">Détails</TabsTrigger>
              </TabsList>

              <TabsContent value="evolution" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Évolution sur 30 jours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                      <LineChart data={dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="views" 
                          stroke="var(--color-views)" 
                          strokeWidth={2}
                          dot={false}
                          name="Vues"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="clicks" 
                          stroke="var(--color-clicks)" 
                          strokeWidth={2}
                          dot={false}
                          name="Clics"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="conversions" 
                          stroke="var(--color-conversions)" 
                          strokeWidth={2}
                          dot={false}
                          name="Conversions"
                        />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="regions" className="mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Répartition des vues par région</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {pieData.length > 0 ? (
                        <ChartContainer config={chartConfig} className="h-[250px] w-full">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={80}
                              dataKey="value"
                            >
                              {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ChartContainer>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          Aucune donnée disponible
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Performance par région</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {regionStats.length > 0 ? (
                        <ChartContainer config={chartConfig} className="h-[250px] w-full">
                          <BarChart data={regionStats.slice(0, 6)} layout="vertical">
                            <XAxis type="number" fontSize={12} />
                            <YAxis 
                              type="category" 
                              dataKey="region_name" 
                              fontSize={11}
                              width={100}
                              tickLine={false}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="views" fill="var(--color-views)" name="Vues" />
                            <Bar dataKey="clicks" fill="var(--color-clicks)" name="Clics" />
                          </BarChart>
                        </ChartContainer>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          Aucune donnée disponible
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Détails par région</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {regionStats.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Région</TableHead>
                            <TableHead className="text-right">Vues</TableHead>
                            <TableHead className="text-right">Clics</TableHead>
                            <TableHead className="text-right">Conversions</TableHead>
                            <TableHead className="text-right">Taux clic</TableHead>
                            <TableHead className="text-right">Taux conv.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {regionStats.map((region) => {
                            const clickRate = region.views > 0 
                              ? ((region.clicks / region.views) * 100).toFixed(1) 
                              : "0";
                            const convRate = region.views > 0 
                              ? ((region.conversions / region.views) * 100).toFixed(1) 
                              : "0";
                            return (
                              <TableRow key={region.region_code}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {region.region_code || "—"}
                                    </Badge>
                                    {region.region_name}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {region.views}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {region.clicks}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {region.conversions}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {clickRate}%
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {convRate}%
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Aucune statistique disponible pour cette annonce
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
