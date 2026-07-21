import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Eye, Users, Clock, MousePointerClick, Smartphone, Monitor, Tablet, Globe, TrendingUp, UserX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";
import RegionsStatsBlock from "@/components/RegionsStatsBlock";

type Range = "7" | "30" | "90";

type PageViewRow = {
  page_url: string;
  visitor_id: string | null;
  user_id: string | null;
  referrer: string | null;
  device_type: string | null;
  utm_source: string | null;
  duration_seconds: number | null;
  created_at: string;
};

const fmtDuration = (sec: number) => {
  if (!sec || sec < 1) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}m${s.toString().padStart(2, "0")}s` : `${s}s`;
};

const referrerLabel = (ref: string | null): string => {
  if (!ref) return "Direct";
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "");
    if (host.includes("google")) return "Google";
    if (host.includes("bing")) return "Bing";
    if (host.includes("facebook") || host.includes("fb.com")) return "Facebook";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("linkedin")) return "LinkedIn";
    if (host.includes("t.co") || host.includes("twitter") || host.includes("x.com")) return "X / Twitter";
    return host;
  } catch {
    return "Autre";
  }
};

const AdminTraficSeo = () => {
  const [range, setRange] = useState<Range>("30");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PageViewRow[]>([]);
  const [leadsCount, setLeadsCount] = useState<number>(0);
  const [excludeMe, setExcludeMe] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("admin_trafic_exclude_me") !== "0";
  });
  const [myVisitorIds, setMyVisitorIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { liveCount } = useOnlinePresence();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - parseInt(range, 10));

      const [{ data: pv }, { count: lc }] = await Promise.all([
        supabase
          .from("page_views")
          .select("page_url,visitor_id,user_id,referrer,device_type,utm_source,duration_seconds,created_at")
          .gte("created_at", since.toISOString())
          .order("created_at", { ascending: false })
          .limit(20000),
        supabase
          .from("leads")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since.toISOString()),
      ]);

      setRows((pv as PageViewRow[]) || []);
      setLeadsCount(lc || 0);
      setLoading(false);
    };
    load();
  }, [range]);

  const kpi = useMemo(() => {
    const uniques = new Set(rows.map((r) => r.visitor_id).filter(Boolean)).size;
    const durations = rows.map((r) => r.duration_seconds || 0).filter((v) => v > 0);
    const avgDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    return {
      views: rows.length,
      uniques,
      avgDuration,
      conversion: uniques > 0 ? (leadsCount / uniques) * 100 : 0,
    };
  }, [rows, leadsCount]);

  const dailySeries = useMemo(() => {
    const days = parseInt(range, 10);
    const map = new Map<string, { views: number; uniques: Set<string> }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().slice(0, 10), { views: 0, uniques: new Set() });
    }
    rows.forEach((r) => {
      const key = r.created_at.slice(0, 10);
      const bucket = map.get(key);
      if (!bucket) return;
      bucket.views += 1;
      if (r.visitor_id) bucket.uniques.add(r.visitor_id);
    });
    return Array.from(map.entries()).map(([date, v]) => ({
      date: date.slice(5),
      views: v.views,
      visiteurs: v.uniques.size,
    }));
  }, [rows, range]);

  const topPages = useMemo(() => {
    const map = new Map<string, { views: number; durSum: number; durN: number }>();
    rows.forEach((r) => {
      const cur = map.get(r.page_url) || { views: 0, durSum: 0, durN: 0 };
      cur.views += 1;
      if (r.duration_seconds && r.duration_seconds > 0) {
        cur.durSum += r.duration_seconds;
        cur.durN += 1;
      }
      map.set(r.page_url, cur);
    });
    return Array.from(map.entries())
      .map(([url, v]) => ({ url, views: v.views, avg: v.durN ? v.durSum / v.durN : 0 }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }, [rows]);

  const sources = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const label = r.utm_source ? `utm:${r.utm_source}` : referrerLabel(r.referrer);
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [rows]);

  const devices = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const key = r.device_type || "inconnu";
      map.set(key, (map.get(key) || 0) + 1);
    });
    const total = rows.length || 1;
    return Array.from(map.entries()).map(([name, value]) => ({
      name,
      value,
      pct: Math.round((value / total) * 100),
    }));
  }, [rows]);

  const deviceIcon = (n: string) => {
    if (n === "mobile") return <Smartphone className="w-4 h-4" />;
    if (n === "tablet") return <Tablet className="w-4 h-4" />;
    if (n === "desktop") return <Monitor className="w-4 h-4" />;
    return <Globe className="w-4 h-4" />;
  };

  const barColors = ["hsl(var(--primary))", "#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#f87171", "#94a3b8"];

  return (
    <>
      <Helmet>
        <title>Trafic & SEO | Administration</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <Link
            to="/administration"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à l'administration
          </Link>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Trafic & SEO
              </h1>
              <p className="text-muted-foreground mt-2">
                Données réelles de fréquentation, pages populaires, sources d'acquisition et santé SEO.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={range} onValueChange={(v) => setRange(v as Range)}>
                <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 derniers jours</SelectItem>
                  <SelectItem value="30">30 derniers jours</SelectItem>
                  <SelectItem value="90">90 derniers jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <KpiCard icon={<Eye className="w-5 h-5" />} label="Pages vues" value={kpi.views.toLocaleString("fr-FR")} tint="bg-primary/10 text-primary" />
                <KpiCard icon={<Users className="w-5 h-5" />} label="Visiteurs uniques" value={kpi.uniques.toLocaleString("fr-FR")} tint="bg-blue-500/10 text-blue-600" />
                <KpiCard icon={<Clock className="w-5 h-5" />} label="Durée moyenne" value={fmtDuration(kpi.avgDuration)} tint="bg-amber-500/10 text-amber-600" />
                <KpiCard icon={<MousePointerClick className="w-5 h-5" />} label="Leads captés" value={leadsCount.toLocaleString("fr-FR")} tint="bg-emerald-500/10 text-emerald-600" />
                <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="Taux de conversion" value={`${kpi.conversion.toFixed(2)}%`} tint="bg-purple-500/10 text-purple-600" hint="Leads / visiteurs uniques" />
              </div>

              {/* Live */}
              <Card className="border-2">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="font-medium">Visiteurs actuellement en ligne</span>
                  </div>
                  <div className="text-3xl font-bold text-primary">{liveCount}</div>
                </CardContent>
              </Card>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Trafic quotidien</CardTitle>
                  <CardDescription>Pages vues et visiteurs uniques par jour</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailySeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <RTooltip
                          contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                        />
                        <Line type="monotone" dataKey="views" name="Pages vues" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="visiteurs" name="Visiteurs" stroke="#60a5fa" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top pages */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pages les plus visitées</CardTitle>
                    <CardDescription>Top 10 par nombre de vues</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {topPages.length === 0 && <p className="text-sm text-muted-foreground">Aucune donnée sur la période.</p>}
                    {topPages.map((p, i) => (
                      <div key={p.url} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition">
                        <div className="flex items-center gap-3 min-w-0">
                          <Badge variant="outline" className="shrink-0">{i + 1}</Badge>
                          <div className="truncate text-sm font-medium">{p.url}</div>
                        </div>
                        <div className="flex items-center gap-4 text-sm shrink-0">
                          <div className="text-right">
                            <div className="font-bold">{p.views}</div>
                            <div className="text-xs text-muted-foreground">vues</div>
                          </div>
                          <div className="text-right hidden sm:block min-w-[60px]">
                            <div className="text-muted-foreground">{fmtDuration(p.avg)}</div>
                            <div className="text-xs text-muted-foreground">durée moy.</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Sources */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sources d'acquisition</CardTitle>
                    <CardDescription>Referrer &amp; campagnes (utm_source)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {sources.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucune donnée sur la période.</p>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={sources} layout="vertical" margin={{ left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={110} />
                            <RTooltip
                              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                            />
                            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                              {sources.map((_, idx) => (
                                <Cell key={idx} fill={barColors[idx % barColors.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Devices */}
                <Card>
                  <CardHeader>
                    <CardTitle>Appareils</CardTitle>
                    <CardDescription>Répartition mobile / tablette / desktop</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {devices.length === 0 && <p className="text-sm text-muted-foreground">Aucune donnée.</p>}
                    {devices.map((d) => (
                      <div key={d.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 capitalize">
                            {deviceIcon(d.name)} {d.name}
                          </div>
                          <div className="text-muted-foreground">
                            {d.value.toLocaleString("fr-FR")} vues • <span className="font-medium text-foreground">{d.pct}%</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${d.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Regions */}
                <RegionsStatsBlock />
              </div>

              <Card className="border-2 border-dashed">
                <CardContent className="p-5 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Conformité RGPD</p>
                  Le tracking est activé uniquement après acceptation du bandeau cookies. Aucune donnée personnelle
                  n'est collectée hors consentement. Les visiteurs peuvent retirer leur consentement à tout moment via
                  le bandeau cookies, ce qui interrompt immédiatement la collecte.
                </CardContent>
              </Card>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
};

const KpiCard = ({
  icon,
  label,
  value,
  tint,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tint: string;
  hint?: string;
}) => (
  <Card className="hover:shadow-lg transition">
    <CardContent className="p-5">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${tint} mb-3`}>{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </CardContent>
  </Card>
);

export default AdminTraficSeo;
