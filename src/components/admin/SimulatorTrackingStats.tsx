import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown, TrendingUp, Users, Repeat, CheckCircle2, Percent, ExternalLink, Search } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input as UInput } from "@/components/ui/input";

interface Props {
  simulatorId: string;
  stepLabels: string[];
}

interface Stats {
  total_sessions: number;
  completions: number;
  completion_rate: number;
  abandon_rate: number;
  unique_visitors: number;
  returning_visitors: number;
  avg_step_reached: number;
  funnel: Array<{ step: number; reached: number; abandoned_here: number }>;
  sources: Array<{ source: string; sessions: number; completions: number }>;
  timeline: Array<{ day: string; sessions: number; completions: number; abandons: number }>;
  sessions: Array<{
    id: string;
    session_key: string;
    visitor_id: string | null;
    email: string | null;
    referrer_source: string | null;
    referrer_url: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    landing_url: string | null;
    user_agent: string | null;
    max_step: number;
    max_step_label: string | null;
    completed: boolean;
    completed_at: string | null;
    abandoned_at_step: number | null;
    created_at: string;
    last_event_at: string;
    total_attempts: number;
    first_seen: string;
  }>;
}

const SOURCE_COLORS: Record<string, string> = {
  google: "#4285F4",
  bing: "#00A4EF",
  duckduckgo: "#DE5833",
  facebook: "#1877F2",
  instagram: "#E4405F",
  tiktok: "#000000",
  linkedin: "#0A66C2",
  youtube: "#FF0000",
  twitter: "#000000",
  chatgpt: "#10A37F",
  perplexity: "#20808D",
  gemini: "#8E44FF",
  claude: "#D97757",
  copilot: "#0078D4",
  direct: "#64748b",
  internal: "#94a3b8",
  email: "#f59e0b",
  other: "#a855f7",
};

const SOURCE_LABELS: Record<string, string> = {
  google: "Google", bing: "Bing", duckduckgo: "DuckDuckGo", yahoo: "Yahoo", qwant: "Qwant",
  ecosia: "Ecosia", brave: "Brave", yandex: "Yandex", baidu: "Baidu",
  facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", linkedin: "LinkedIn",
  youtube: "YouTube", twitter: "Twitter/X", pinterest: "Pinterest", reddit: "Reddit",
  snapchat: "Snapchat", threads: "Threads",
  chatgpt: "ChatGPT", perplexity: "Perplexity", gemini: "Gemini", claude: "Claude",
  copilot: "Copilot", you: "You.com",
  direct: "Direct / Bookmark", internal: "Interne", email: "Email", other: "Autre",
};

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function formatDT(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

function sourceLabel(s: string | null) {
  const key = (s || "direct").toLowerCase();
  return SOURCE_LABELS[key] || key;
}

function sourceColor(s: string | null) {
  return SOURCE_COLORS[(s || "direct").toLowerCase()] || "#a855f7";
}

export default function SimulatorTrackingStats({ simulatorId, stepLabels }: Props) {
  const [start, setStart] = useState<string>(todayISO(-30));
  const [end, setEnd] = useState<string>(todayISO(0));
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const startTS = new Date(start + "T00:00:00").toISOString();
      const endTS = new Date(end + "T23:59:59").toISOString();
      const { data, error } = await supabase.rpc("get_simulator_tracking_stats", {
        p_simulator_id: simulatorId,
        p_start: startTS,
        p_end: endTS,
      });
      if (error) throw error;
      setStats(data as unknown as Stats);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [simulatorId]);

  const funnelData = useMemo(() => {
    if (!stats) return [];
    return stats.funnel.map((f) => {
      const label = f.step === 9 ? "Résultat" : (stepLabels[f.step - 1] || `Étape ${f.step}`);
      const first = stats.funnel[0]?.reached || 0;
      const rate = first > 0 ? (f.reached / first) * 100 : 0;
      const prev = stats.funnel[f.step - 2]?.reached;
      const dropoff = prev ? Math.max(0, ((prev - f.reached) / prev) * 100) : 0;
      return { step: `${f.step}. ${label}`, reached: f.reached, abandoned: f.abandoned_here, rate: Math.round(rate * 10) / 10, dropoff: Math.round(dropoff * 10) / 10 };
    });
  }, [stats, stepLabels]);

  const filteredSessions = useMemo(() => {
    if (!stats) return [];
    const q = search.trim().toLowerCase();
    if (!q) return stats.sessions;
    return stats.sessions.filter((s) =>
      (s.email || "").toLowerCase().includes(q) ||
      (s.session_key || "").toLowerCase().includes(q) ||
      (s.referrer_source || "").toLowerCase().includes(q) ||
      (s.utm_campaign || "").toLowerCase().includes(q) ||
      (s.referrer_url || "").toLowerCase().includes(q)
    );
  }, [stats, search]);

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-end gap-4">
          <div>
            <Label className="text-xs">Du</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-[160px]" />
          </div>
          <div>
            <Label className="text-xs">Au</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-[160px]" />
          </div>
          <Button onClick={load} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Actualiser
          </Button>
          <div className="flex gap-2 ml-auto text-xs">
            {[
              { label: "7j", d: -7 }, { label: "30j", d: -30 }, { label: "90j", d: -90 }, { label: "1 an", d: -365 },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => { setStart(todayISO(p.d)); setEnd(todayISO(0)); setTimeout(load, 50); }}
                className="px-3 py-1 rounded-full border hover:bg-muted"
              >{p.label}</button>
            ))}
          </div>
        </CardContent>
      </Card>

      {error && <div className="text-sm text-red-600 p-3 border border-red-200 rounded bg-red-50">{error}</div>}

      {stats && (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <KPI icon={<Users className="w-4 h-4" />} label="Tentatives" value={stats.total_sessions} tone="blue" />
            <KPI icon={<CheckCircle2 className="w-4 h-4" />} label="Complétions" value={stats.completions} tone="green" />
            <KPI icon={<Percent className="w-4 h-4" />} label="Taux compl." value={`${stats.completion_rate}%`} tone="green" />
            <KPI icon={<TrendingDown className="w-4 h-4" />} label="Taux abandon" value={`${stats.abandon_rate}%`} tone="red" />
            <KPI icon={<Users className="w-4 h-4" />} label="Visiteurs uniques" value={stats.unique_visitors} tone="indigo" />
            <KPI icon={<Repeat className="w-4 h-4" />} label="Récurrents" value={stats.returning_visitors} tone="amber" />
            <KPI icon={<TrendingUp className="w-4 h-4" />} label="Étape moy." value={stats.avg_step_reached} tone="purple" />
          </div>

          {/* Funnel */}
          <Card>
            <CardHeader><CardTitle className="text-base">Funnel — abandon par étape</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData} margin={{ top: 20, right: 20, bottom: 40, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="step" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" interval={0} height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any, name: any) => name === "rate" || name === "dropoff" ? `${v}%` : v} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="reached" name="Visiteurs arrivés" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="abandoned" name="Abandons sur cette étape" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Détails texte funnel */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mt-4">
                {funnelData.map((f) => (
                  <div key={f.step} className="p-2 rounded-lg bg-muted/40 text-xs">
                    <div className="font-medium truncate">{f.step}</div>
                    <div className="flex justify-between mt-1"><span>Arrivés</span><span className="font-semibold">{f.reached}</span></div>
                    <div className="flex justify-between text-red-600"><span>Drop-off</span><span>{f.dropoff}%</span></div>
                    <div className="flex justify-between text-slate-500"><span>vs étape 1</span><span>{f.rate}%</span></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline + Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Évolution dans le temps</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.timeline} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="sessions" name="Tentatives" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="completions" name="Complétions" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="abandons" name="Abandons" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Sources de trafic</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.sources}
                        dataKey="sessions"
                        nameKey="source"
                        outerRadius={80}
                        label={(e: any) => `${sourceLabel(e.source)} (${e.sessions})`}
                        labelLine={false}
                      >
                        {stats.sources.map((s, i) => (
                          <Cell key={i} fill={sourceColor(s.source)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any, _n, p: any) => [`${v} sessions`, sourceLabel(p?.payload?.source)]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-1 max-h-[140px] overflow-auto text-xs">
                  {stats.sources.map((s) => {
                    const rate = s.sessions > 0 ? Math.round((s.completions / s.sessions) * 100) : 0;
                    return (
                      <div key={s.source} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: sourceColor(s.source) }} />
                          {sourceLabel(s.source)}
                        </span>
                        <span className="text-slate-500">{s.sessions} · {rate}% compl.</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sessions détaillées */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <CardTitle className="text-base">Sessions détaillées ({filteredSessions.length})</CardTitle>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                  <UInput className="pl-8 w-[280px]" placeholder="Rechercher email, source, campagne…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visiteur</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>UTM / Campagne</TableHead>
                    <TableHead>Étape max</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Tentatives</TableHead>
                    <TableHead>Dernière</TableHead>
                    <TableHead>Vue depuis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((s) => {
                    const gap = new Date(s.created_at).getTime() - new Date(s.first_seen).getTime();
                    const gapDays = Math.round(gap / (1000 * 60 * 60 * 24));
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="max-w-[200px]">
                          <div className="font-mono text-xs truncate" title={s.session_key}>{s.session_key.slice(0, 14)}…</div>
                          {s.email && <div className="text-xs text-emerald-700 truncate">{s.email}</div>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" style={{ borderColor: sourceColor(s.referrer_source), color: sourceColor(s.referrer_source) }}>
                            {sourceLabel(s.referrer_source)}
                          </Badge>
                          {s.referrer_url && (
                            <a href={s.referrer_url} target="_blank" rel="noreferrer" className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 mt-1 max-w-[180px] truncate">
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">{s.referrer_url}</span>
                            </a>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {s.utm_source && <div><span className="text-slate-500">src:</span> {s.utm_source}</div>}
                          {s.utm_medium && <div><span className="text-slate-500">med:</span> {s.utm_medium}</div>}
                          {s.utm_campaign && <div><span className="text-slate-500">camp:</span> {s.utm_campaign}</div>}
                          {!s.utm_source && !s.utm_medium && !s.utm_campaign && <span className="text-slate-400">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{s.max_step}/9</div>
                          <div className="text-xs text-slate-500">{s.max_step_label || (s.max_step === 9 ? "Résultat" : "—")}</div>
                        </TableCell>
                        <TableCell>
                          {s.completed
                            ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Complété</Badge>
                            : <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">Abandon</Badge>}
                        </TableCell>
                        <TableCell>
                          {s.total_attempts > 1 ? <Badge variant="secondary">{s.total_attempts}× revenu</Badge> : <span className="text-slate-400 text-xs">1×</span>}
                          {s.total_attempts > 1 && <div className="text-xs text-slate-500 mt-0.5">{gapDays === 0 ? "même jour" : `+${gapDays}j`}</div>}
                        </TableCell>
                        <TableCell className="text-xs">{formatDT(s.last_event_at)}</TableCell>
                        <TableCell className="text-xs text-slate-500">{formatDT(s.first_seen)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredSessions.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-slate-500 py-8">Aucune session sur cette période.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function KPI({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number | string; tone: string }) {
  const toneMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <div className={`rounded-xl border p-3 ${toneMap[tone]}`}>
      <div className="flex items-center gap-1.5 text-xs opacity-80">{icon}<span>{label}</span></div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}
