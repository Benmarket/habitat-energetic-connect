import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Search, Mail, Phone, ChevronDown, ChevronRight, Users, Inbox, Repeat, Download, CalendarIcon, X, MapPin, Globe, BarChart3, ShieldCheck, Cookie, FileText } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, Legend, CartesianGrid } from "recharts";

type PresetKey = "today" | "yesterday" | "7d" | "30d" | "month" | "lastMonth" | "lastYear" | "max";
const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "today", label: "Aujourd'hui" },
  { key: "yesterday", label: "Hier" },
  { key: "7d", label: "7 jours" },
  { key: "30d", label: "30 jours" },
  { key: "month", label: "Ce mois" },
  { key: "lastMonth", label: "Mois dernier" },
  { key: "lastYear", label: "L'an dernier" },
  { key: "max", label: "Maximum" },
];

function computePreset(key: PresetKey): DateRange {
  const now = new Date();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end = new Date(now); end.setHours(23, 59, 59, 999);
  switch (key) {
    case "today": return { from: start, to: end };
    case "yesterday": {
      const s = new Date(start); s.setDate(s.getDate() - 1);
      const e = new Date(end); e.setDate(e.getDate() - 1);
      return { from: s, to: e };
    }
    case "7d": { const s = new Date(start); s.setDate(s.getDate() - 6); return { from: s, to: end }; }
    case "30d": { const s = new Date(start); s.setDate(s.getDate() - 29); return { from: s, to: end }; }
    case "month": return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: end };
    case "lastMonth": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { from: s, to: e };
    }
    case "lastYear": {
      const s = new Date(now.getFullYear() - 1, 0, 1);
      const e = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return { from: s, to: e };
    }
    case "max": return { from: undefined, to: undefined };
  }
}

type RegionInfo = { code: string; label: string; emoji: string };

const REGION_META: Record<string, RegionInfo> = {
  metropole: { code: "metropole", label: "France métropolitaine", emoji: "🇫🇷" },
  corse: { code: "corse", label: "Corse", emoji: "🏝️" },
  guadeloupe: { code: "guadeloupe", label: "Guadeloupe", emoji: "🌴" },
  martinique: { code: "martinique", label: "Martinique", emoji: "🌺" },
  guyane: { code: "guyane", label: "Guyane", emoji: "🌳" },
  reunion: { code: "reunion", label: "La Réunion", emoji: "🌋" },
  mayotte: { code: "mayotte", label: "Mayotte", emoji: "🐢" },
  autre: { code: "autre", label: "Autres / Outre-mer", emoji: "🌐" },
  inconnu: { code: "inconnu", label: "Région inconnue", emoji: "❓" },
};

function detectRegion(postal: string | null): RegionInfo {
  if (!postal) return REGION_META.inconnu;
  const cp = String(postal).replace(/\s/g, "").slice(0, 5);
  if (/^(2[ab]|20)/i.test(cp)) return REGION_META.corse;
  if (cp.startsWith("971")) return REGION_META.guadeloupe;
  if (cp.startsWith("972")) return REGION_META.martinique;
  if (cp.startsWith("973")) return REGION_META.guyane;
  if (cp.startsWith("974")) return REGION_META.reunion;
  if (cp.startsWith("976")) return REGION_META.mayotte;
  if (/^\d{5}$/.test(cp)) {
    const n = parseInt(cp, 10);
    if (n >= 1000 && n <= 95999) return REGION_META.metropole;
    return REGION_META.autre;
  }
  return REGION_META.inconnu;
}

/** Région déduite du contexte de page (URL régionale / région active) faute de code postal. */
const CONTEXT_TO_REGION: Record<string, string> = {
  fr: "metropole",
  corse: "corse",
  reunion: "reunion",
  martinique: "martinique",
  guadeloupe: "guadeloupe",
  guyane: "guyane",
  mayotte: "mayotte",
};

function regionFromContext(ctx?: string | null, url?: string | null): RegionInfo | null {
  const code = ctx?.toLowerCase();
  if (code && CONTEXT_TO_REGION[code]) return REGION_META[CONTEXT_TO_REGION[code]];
  if (url) {
    try {
      const segs = new URL(url).pathname.toLowerCase().split("/").filter(Boolean);
      const seg = segs.find((s) => CONTEXT_TO_REGION[s]);
      if (seg) return REGION_META[CONTEXT_TO_REGION[seg]];
    } catch {
      /* noop */
    }
  }
  return null;
}

type Attribution = {
  referrer_source?: string | null;
  referrer_url?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  landing_url?: string | null;
  current_url?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
} | null;

/** Turn a full URL into a short readable path like "/simulateurs/solaire". */
function prettyPath(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const path = (u.pathname || "/") + (u.search || "");
    return path.length > 60 ? path.slice(0, 57) + "…" : path;
  } catch {
    return url;
  }
}

type ConsentInfo = {
  form_rgpd?: boolean;
  cookies?: "accepted" | "refused" | "unknown";
  cookies_at?: string | null;
  timestamp?: string;
  version?: string;
} | null;

type UnifiedLead = {
  id: string;
  formId: string | null;
  formName: string;
  formIdentifier: string;
  submittedAt: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  postalCode: string | null;
  region: RegionInfo;
  data: Record<string, any>;
  attribution?: Attribution;
  consent?: ConsentInfo;
};


function extractPostal(data: any): string | null {
  if (!data || typeof data !== "object") return null;
  const raw =
    data.postalCode || data.postal_code || data.codePostal || data.code_postal ||
    data.cp || data.zip || data.zipCode || data.zip_code || null;
  if (!raw) return null;
  const s = String(raw).trim();
  return s || null;
}

function extractContact(data: any): { email: string | null; phone: string | null; name: string | null } {
  if (!data || typeof data !== "object") return { email: null, phone: null, name: null };
  const email =
    data.email || data.mail || data.Email || data.e_mail || null;
  const phone =
    data.phone || data.telephone || data.tel || data.phoneNumber || data.mobile || null;
  const fullName =
    data.fullName ||
    data.full_name ||
    data.name ||
    [data.firstName || data.prenom || data.first_name, data.lastName || data.nom || data.last_name]
      .filter(Boolean)
      .join(" ") ||
    null;
  return {
    email: email ? String(email).toLowerCase().trim() : null,
    phone: phone ? String(phone).trim() : null,
    name: fullName ? String(fullName).trim() : null,
  };
}

function normalizeKey(email: string | null, phone: string | null): string | null {
  if (email) return `e:${email}`;
  if (phone) return `p:${phone.replace(/\D/g, "")}`;
  return null;
}

export default function AllLeadsPanel() {
  const [search, setSearch] = useState("");
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const [preset, setPreset] = useState<PresetKey>("30d");
  const [range, setRange] = useState<DateRange>(() => computePreset("30d"));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [regionFilter, setRegionFilter] = useState<Set<string>>(new Set());
  const [chartMode, setChartMode] = useState<"total" | "region">("region");

  const applyPreset = (k: PresetKey) => { setPreset(k); setRange(computePreset(k)); };
  const rangeLabel = range.from || range.to
    ? `${range.from ? format(range.from, "yyyy-MM-dd") : "…"} → ${range.to ? format(range.to, "yyyy-MM-dd") : "…"}`
    : "Toutes les dates";


  const { data, isLoading } = useQuery({
    queryKey: ["all-leads-unified"],
    queryFn: async () => {
      const [forms, subs, news] = await Promise.all([
        supabase.from("form_configurations").select("id, name, form_identifier"),
        supabase.from("form_submissions").select("id, form_id, data, submitted_at, attribution, consent").order("submitted_at", { ascending: false }).limit(2000),
        supabase.from("newsletter_subscribers").select("id, email, source, subscribed_at, created_at, attribution, consent").order("subscribed_at", { ascending: false }).limit(2000),
      ]);
      if (forms.error) throw forms.error;
      if (subs.error) throw subs.error;

      const formMap = new Map((forms.data || []).map((f: any) => [f.id, f]));
      const leads: UnifiedLead[] = [];

      (subs.data || []).forEach((s: any) => {
        const form = formMap.get(s.form_id);
        const c = extractContact(s.data);
        const postal = extractPostal(s.data);
        leads.push({
          id: s.id,
          formId: s.form_id,
          formName: form?.name || "Formulaire inconnu",
          formIdentifier: form?.form_identifier || "—",
          submittedAt: s.submitted_at,
          email: c.email,
          phone: c.phone,
          name: c.name,
          postalCode: postal,
          region: detectRegion(postal),
          data: s.data || {},
          attribution: s.attribution || null,
          consent: s.consent || null,
        });
      });

      if (!news.error) {
        (news.data || []).forEach((n: any) => {
          leads.push({
            id: `news_${n.id}`,
            formId: null,
            formName: "Newsletter",
            formIdentifier: "newsletter",
            submittedAt: n.subscribed_at || n.created_at,
            email: n.email ? String(n.email).toLowerCase().trim() : null,
            phone: null,
            name: null,
            postalCode: null,
            region: REGION_META.inconnu,
            data: { email: n.email, source: n.source },
            attribution: n.attribution || null,
            consent: n.consent || null,
          });
        });
      }

      leads.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      return leads;
    },
    refetchInterval: 15000,
  });


  const allLeads = data || [];
  const leads = useMemo(() => {
    if (!range.from && !range.to) return allLeads;
    const fromT = range.from ? new Date(range.from).setHours(0, 0, 0, 0) : -Infinity;
    const toT = range.to ? new Date(range.to).setHours(23, 59, 59, 999) : Infinity;
    return allLeads.filter((l) => {
      const t = new Date(l.submittedAt).getTime();
      return t >= fromT && t <= toT;
    });
  }, [allLeads, range]);

  // Tracking sessions — used to backfill region + traffic source per lead
  const { data: trackingByEmail } = useQuery({
    queryKey: ["all-leads-tracking"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("simulator_tracking_sessions")
        .select("email, referrer_source, referrer_url, utm_source, utm_medium, utm_campaign, landing_url, ip_hash, created_at")
        .not("email", "is", null)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) return new Map<string, any>();
      const map = new Map<string, any>();
      (data || []).forEach((r: any) => {
        const key = String(r.email || "").toLowerCase().trim();
        if (key && !map.has(key)) map.set(key, r);
      });
      return map;
    },
    refetchInterval: 30000,
  });

  // Group by contact key
  const grouped = useMemo(() => {
    const map = new Map<string, { key: string; email: string | null; phone: string | null; name: string | null; leads: UnifiedLead[] }>();
    const orphans: UnifiedLead[] = [];
    leads.forEach((l) => {
      const key = normalizeKey(l.email, l.phone);
      if (!key) {
        orphans.push(l);
        return;
      }
      if (!map.has(key)) {
        map.set(key, { key, email: l.email, phone: l.phone, name: l.name, leads: [] });
      }
      const g = map.get(key)!;
      g.leads.push(l);
      if (!g.name && l.name) g.name = l.name;
      if (!g.email && l.email) g.email = l.email;
      if (!g.phone && l.phone) g.phone = l.phone;
    });
    const groups = Array.from(map.values()).map((g) => {
      // Region: use first submission with a postal code, else inconnu
      const withPostal = g.leads.find((l) => l.postalCode);
      const region: RegionInfo = withPostal?.region || REGION_META.inconnu;
      // Prefer the most recent submission's own attribution, fall back to tracking-session join
      const withAttr = g.leads.find((l) => l.attribution && (l.attribution.referrer_source || l.attribution.utm_source || l.attribution.referrer_url));
      const own = withAttr?.attribution || null;
      const tracking = g.email ? trackingByEmail?.get(g.email) : null;
      const src = own || tracking || null;
      let trafficSource: string | null =
        src?.utm_source ||
        src?.referrer_source ||
        null;
      if (!trafficSource && src?.referrer_url) {
        try { trafficSource = new URL(src.referrer_url).hostname.replace(/^www\./, ""); } catch { /* noop */ }
      }
      return {
        ...g,
        lastAt: g.leads[0]?.submittedAt,
        region,
        postalCode: withPostal?.postalCode || null,
        trafficSource,
        landingUrl: src?.landing_url || null,
        utmMedium: src?.utm_medium || null,
        utmCampaign: src?.utm_campaign || null,
        referrerUrl: src?.referrer_url || null,
      };
    });

    groups.sort((a, b) => new Date(b.lastAt!).getTime() - new Date(a.lastAt!).getTime());
    return { groups, orphans };
  }, [leads, trackingByEmail]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return grouped.groups.filter((g) => {
      if (regionFilter.size > 0 && !regionFilter.has(g.region.code)) return false;
      if (!q) return true;
      return (
        g.email?.toLowerCase().includes(q) ||
        g.phone?.toLowerCase().includes(q) ||
        g.name?.toLowerCase().includes(q) ||
        g.leads.some((l) => l.formName.toLowerCase().includes(q))
      );
    });
  }, [grouped, search, regionFilter]);

  // Chart: daily volume, optionally split by region. Uses grouped/region-filtered leads flattened.
  const chartData = useMemo(() => {
    const toLocalDay = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dd}`;
    };
    const flat = filtered.flatMap((g) => g.leads.map((l) => ({ ...l, region: g.region })));
    const byDay = new Map<string, Record<string, number>>();
    flat.forEach((l) => {
      const day = toLocalDay(new Date(l.submittedAt));
      if (!byDay.has(day)) byDay.set(day, {});
      const row = byDay.get(day)!;
      const k = chartMode === "region" ? l.region.code : "total";
      row[k] = (row[k] || 0) + 1;
    });
    // Build a sorted list of days spanning the range if defined
    let start = range.from ? new Date(range.from) : null;
    let end = range.to ? new Date(range.to) : null;
    if (!start || !end) {
      const days = Array.from(byDay.keys()).sort();
      if (days.length) {
        start = start || new Date(days[0] + "T00:00:00");
        end = end || new Date(days[days.length - 1] + "T00:00:00");
      }
    }
    const rows: any[] = [];
    if (start && end) {
      const cur = new Date(start); cur.setHours(0, 0, 0, 0);
      const stop = new Date(end); stop.setHours(0, 0, 0, 0);
      while (cur.getTime() <= stop.getTime()) {
        const key = toLocalDay(cur);
        const row: any = { day: key, label: format(cur, "dd/MM") };
        const entries = byDay.get(key) || {};
        Object.assign(row, entries);
        rows.push(row);
        cur.setDate(cur.getDate() + 1);
      }
    }

    // Active region series (only those with data)
    const activeCodes = new Set<string>();
    byDay.forEach((row) => Object.keys(row).forEach((k) => activeCodes.add(k)));
    return { rows, activeCodes: Array.from(activeCodes) };
  }, [filtered, chartMode, range]);

  const REGION_COLORS: Record<string, string> = {
    metropole: "hsl(210 90% 55%)",
    corse: "hsl(280 70% 55%)",
    guadeloupe: "hsl(150 65% 45%)",
    martinique: "hsl(0 75% 60%)",
    guyane: "hsl(90 55% 45%)",
    reunion: "hsl(25 90% 55%)",
    mayotte: "hsl(190 70% 45%)",
    autre: "hsl(45 90% 55%)",
    inconnu: "hsl(220 10% 60%)",
    total: "hsl(var(--primary))",
  };

  const toggleRegion = (code: string) => {
    setRegionFilter((prev) => {
      const n = new Set(prev);
      n.has(code) ? n.delete(code) : n.add(code);
      return n;
    });
  };

  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const uniquePeople = grouped.groups.length;
    const multi = grouped.groups.filter((g) => g.leads.length > 1).length;
    return { totalLeads, uniquePeople, multi };
  }, [leads, grouped]);

  const toggle = (k: string) => {
    setOpenKeys((prev) => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  };

  const exportCSV = () => {
    const rows = [
      ["Date", "Nom", "Email", "Téléphone", "Formulaire", "Identifiant"],
      ...leads.map((l) => [
        new Date(l.submittedAt).toLocaleString("fr-FR"),
        l.name || "",
        l.email || "",
        l.phone || "",
        l.formName,
        l.formIdentifier,
      ]),
    ];
    const csv = rows
      .map((r) =>
        r.map((v) => (typeof v === "string" && (v.includes(",") || v.includes('"')) ? `"${v.replace(/"/g, '""')}"` : v)).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tous-les-leads_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Inbox className="h-5 w-5 text-primary" />
              Tous les leads — vue unifiée
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Agrégation en temps réel de toutes les soumissions, groupées par personne (email/téléphone), du plus récent au plus ancien.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1"><Inbox className="h-3 w-3" /> {stats.totalLeads} soumissions</Badge>
            <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" /> {stats.uniquePeople} personnes</Badge>
            <Badge variant="secondary" className="gap-1"><Repeat className="h-3 w-3" /> {stats.multi} récurrentes</Badge>
            <Button size="sm" variant="outline" onClick={exportCSV} disabled={!leads.length}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal gap-2 sm:w-auto",
                  !range.from && !range.to && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                <span className="truncate">{rangeLabel}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex">
                <div className="flex flex-col border-r p-2 min-w-[140px]">
                  {PRESETS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => applyPreset(p.key)}
                      className={cn(
                        "text-left text-sm px-3 py-2 rounded-md hover:bg-muted transition-colors",
                        preset === p.key && "bg-muted font-medium",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="p-2">
                  <Calendar
                    mode="range"
                    selected={range}
                    onSelect={(r) => { if (r) setRange(r); }}
                    numberOfMonths={1}
                    locale={fr}
                    className={cn("p-3 pointer-events-auto")}
                  />
                  <div className="flex items-center justify-between px-2 pb-1">
                    <button
                      onClick={() => { setRange({ from: undefined, to: undefined }); setPreset("max"); }}
                      className="text-xs text-primary hover:underline"
                    >
                      Effacer
                    </button>
                    <Button size="sm" variant="ghost" onClick={() => setPickerOpen(false)} className="h-7">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par email, téléphone, nom ou formulaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>

        {/* Region filter chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Régions :</span>
          {Object.values(REGION_META).map((r) => {
            const active = regionFilter.has(r.code);
            const count = grouped.groups.filter((g) => g.region.code === r.code).length;
            if (count === 0 && !active) return null;
            return (
              <button
                key={r.code}
                onClick={() => toggleRegion(r.code)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-border",
                )}
              >
                <span aria-hidden>{r.emoji}</span>
                <span>{r.label}</span>
                <span className={cn("ml-0.5 opacity-70", active && "opacity-100")}>({count})</span>
              </button>
            );
          })}
          {regionFilter.size > 0 && (
            <button
              onClick={() => setRegionFilter(new Set())}
              className="text-xs text-primary hover:underline ml-1"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Volume chart */}
        <div className="rounded-md border bg-background p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BarChart3 className="h-4 w-4 text-primary" />
              Volume de leads sur la période
            </div>
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setChartMode("total")}
                className={cn(
                  "px-2 py-1 rounded-md border transition-colors",
                  chartMode === "total" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted",
                )}
              >
                Total
              </button>
              <button
                onClick={() => setChartMode("region")}
                className={cn(
                  "px-2 py-1 rounded-md border transition-colors",
                  chartMode === "region" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted",
                )}
              >
                Par région
              </button>
            </div>
          </div>
          {chartData.rows.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-8">Aucune donnée sur la période.</div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.rows} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <RTooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                    formatter={(value: any, name: any) => [value, REGION_META[name]?.label || name]}
                  />
                  {chartMode === "region" && <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v) => REGION_META[v]?.label || v} />}
                  {chartMode === "total" ? (
                    <Bar dataKey="total" fill={REGION_COLORS.total} radius={[4, 4, 0, 0]} />
                  ) : (
                    chartData.activeCodes.map((code) => (
                      <Bar
                        key={code}
                        dataKey={code}
                        stackId="regions"
                        fill={REGION_COLORS[code] || REGION_COLORS.inconnu}
                        radius={[0, 0, 0, 0]}
                      />
                    ))
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>




        <div className="max-h-[520px] overflow-y-auto rounded-md border bg-background">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Aucun lead trouvé</div>
          ) : (
            <ul className="divide-y">
              {filtered.slice(0, 200).map((g) => {
                const last = g.leads[0];
                const isOpen = openKeys.has(g.key);
                return (
                  <li key={g.key}>
                    <Collapsible open={isOpen} onOpenChange={() => toggle(g.key)}>
                      <CollapsibleTrigger asChild>
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 text-left">
                          {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm truncate">
                                {g.name || g.email || g.phone || "Anonyme"}
                              </span>
                              {g.leads.length > 1 && (
                                <Badge variant="default" className="h-5 gap-1">
                                  <Repeat className="h-3 w-3" /> {g.leads.length}×
                                </Badge>
                              )}
                              <Badge variant="outline" className="h-5 text-xs">{last.formName}</Badge>
                              <Badge
                                variant="secondary"
                                className="h-5 text-xs gap-1"
                                title={g.postalCode ? `Code postal: ${g.postalCode}` : "Aucun code postal renseigné"}
                              >
                                <span aria-hidden>{g.region.emoji}</span>
                                <MapPin className="h-3 w-3" />
                                {g.region.label}
                                {g.postalCode && <span className="opacity-70 ml-1">({g.postalCode})</span>}
                              </Badge>
                              {g.trafficSource && (
                                <Badge
                                  variant="outline"
                                  className="h-5 text-xs gap-1 border-primary/40 text-primary"
                                  title={[g.landingUrl && `Landing: ${g.landingUrl}`, g.referrerUrl && `Referrer: ${g.referrerUrl}`, g.utmMedium && `Medium: ${g.utmMedium}`, g.utmCampaign && `Campagne: ${g.utmCampaign}`].filter(Boolean).join("\n") || undefined}
                                >
                                  <Globe className="h-3 w-3" />
                                  {g.trafficSource}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                              {g.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{g.email}</span>}
                              {g.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{g.phone}</span>}
                              {(() => {
                                const page = prettyPath(last.attribution?.current_url) || prettyPath(last.attribution?.landing_url);
                                if (!page) return null;
                                return (
                                  <span
                                    className="flex items-center gap-1 font-mono"
                                    title={last.attribution?.current_url || last.attribution?.landing_url || undefined}
                                  >
                                    <FileText className="h-3 w-3" />
                                    {page}
                                  </span>
                                );
                              })()}
                              <span>· {new Date(last.submittedAt).toLocaleString("fr-FR")}</span>
                            </div>
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-3 pl-11 space-y-2">
                          {g.leads.map((l) => (
                            <div key={l.id} className="rounded-md border bg-muted/30 p-2.5 text-xs">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="secondary" className="h-5">{l.formName}</Badge>
                                  <span className="text-muted-foreground font-mono">{l.formIdentifier}</span>
                                  <Badge variant="outline" className="h-5 text-[10px] gap-1">
                                    <span aria-hidden>{l.region.emoji}</span>
                                    {l.region.label}
                                    {l.postalCode && <span className="opacity-70">· {l.postalCode}</span>}
                                  </Badge>
                                  {(() => {
                                    const page = prettyPath(l.attribution?.current_url) || prettyPath(l.attribution?.landing_url);
                                    if (!page) return null;
                                    return (
                                      <Badge
                                        variant="outline"
                                        className="h-5 text-[10px] gap-1 font-mono border-primary/30 text-primary"
                                        title={
                                          [
                                            l.attribution?.current_url && `Page inscription: ${l.attribution.current_url}`,
                                            l.attribution?.landing_url && l.attribution.landing_url !== l.attribution?.current_url && `Landing: ${l.attribution.landing_url}`,
                                          ].filter(Boolean).join("\n") || undefined
                                        }
                                      >
                                        <FileText className="h-3 w-3" />
                                        {page}
                                      </Badge>
                                    );
                                  })()}
                                  {l.consent && (
                                    <>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "h-5 text-[10px] gap-1",
                                          l.consent.form_rgpd
                                            ? "border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
                                            : "border-amber-500/50 text-amber-700 dark:text-amber-500",
                                        )}
                                        title={l.consent.form_rgpd ? "Consentement RGPD coché lors de la soumission" : "Consentement RGPD non coché"}
                                      >
                                        <ShieldCheck className="h-3 w-3" />
                                        RGPD {l.consent.form_rgpd ? "✓" : "✗"}
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          "h-5 text-[10px] gap-1",
                                          l.consent.cookies === "accepted"
                                            ? "border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
                                            : l.consent.cookies === "refused"
                                              ? "border-red-500/50 text-red-700 dark:text-red-400"
                                              : "border-muted-foreground/40 text-muted-foreground",
                                        )}
                                        title={
                                          l.consent.cookies_at
                                            ? `Cookies: ${l.consent.cookies} (${new Date(l.consent.cookies_at).toLocaleString("fr-FR")})`
                                            : `Cookies: ${l.consent.cookies ?? "inconnu"}`
                                        }
                                      >
                                        <Cookie className="h-3 w-3" />
                                        {l.consent.cookies === "accepted"
                                          ? "Cookies ✓"
                                          : l.consent.cookies === "refused"
                                            ? "Cookies ✗"
                                            : "Cookies ?"}
                                      </Badge>
                                    </>
                                  )}
                                </div>
                                <span className="text-muted-foreground">{new Date(l.submittedAt).toLocaleString("fr-FR")}</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5">
                                {Object.entries(l.data)
                                  .filter(([k]) => !k.startsWith("_"))
                                  .slice(0, 10)
                                  .map(([k, v]) => (
                                    <div key={k} className="truncate">
                                      <span className="text-muted-foreground">{k}:</span>{" "}
                                      <span className="font-medium">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {grouped.orphans.length > 0 && (
          <p className="text-xs text-muted-foreground">
            + {grouped.orphans.length} soumission(s) sans email/téléphone (non groupables).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
