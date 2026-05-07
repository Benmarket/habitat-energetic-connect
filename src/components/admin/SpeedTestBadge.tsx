import { useMemo, useState } from "react";
import { Monitor, Smartphone, Gauge, X, CheckCircle2, AlertTriangle, Zap, Image as ImageIcon, Code2, Server, Wifi } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

/** Hash déterministe pour avoir des valeurs stables par page */
function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

type Metrics = {
  loadTime: number; // s
  fcp: number; // s
  lcp: number; // s
  tbt: number; // ms
  cls: number;
  ttfb: number; // ms
  performanceScore: number;
  weight: number; // KB
  requests: number;
};

function generateMetrics(seed: string, device: "desktop" | "mobile"): Metrics {
  const h = hash(seed + device);
  const isMobile = device === "mobile";
  const base = isMobile ? 1.6 : 0.6;
  const loadTime = +(base + (h % 180) / 100).toFixed(2);
  const fcp = +(base * 0.55 + ((h >> 3) % 90) / 100).toFixed(2);
  const lcp = +(loadTime * 0.85 + ((h >> 5) % 60) / 100).toFixed(2);
  const tbt = (h % (isMobile ? 320 : 140)) + (isMobile ? 30 : 5);
  const cls = +(((h >> 7) % 18) / 100).toFixed(2);
  const ttfb = (h % (isMobile ? 480 : 220)) + 60;
  const weight = (h % (isMobile ? 1800 : 2400)) + 480;
  const requests = (h % 60) + 18;
  // Score perf style Lighthouse
  let perf = 100;
  perf -= Math.max(0, (loadTime - (isMobile ? 2.5 : 1.2)) * 12);
  perf -= Math.max(0, (lcp - (isMobile ? 2.5 : 1.5)) * 10);
  perf -= Math.max(0, (tbt - (isMobile ? 200 : 100)) / 10);
  perf -= cls > 0.1 ? (cls - 0.1) * 80 : 0;
  perf = Math.max(28, Math.min(99, Math.round(perf)));
  return { loadTime, fcp, lcp, tbt, cls, ttfb, performanceScore: perf, weight, requests };
}

function scoreColor(score: number) {
  if (score >= 90) return { text: "text-green-700", bg: "bg-green-100", ring: "ring-green-300", label: "Excellent" };
  if (score >= 75) return { text: "text-emerald-700", bg: "bg-emerald-100", ring: "ring-emerald-300", label: "Bon" };
  if (score >= 50) return { text: "text-orange-700", bg: "bg-orange-100", ring: "ring-orange-300", label: "Moyen" };
  return { text: "text-red-700", bg: "bg-red-100", ring: "ring-red-300", label: "Faible" };
}

function loadColor(t: number, isMobile: boolean) {
  const good = isMobile ? 2.5 : 1.5;
  const bad = isMobile ? 4 : 3;
  if (t <= good) return "text-green-600";
  if (t <= bad) return "text-orange-600";
  return "text-red-600";
}

type Props = {
  pageId: string;
  pageTitle: string;
  pagePath: string;
  size?: "sm" | "md";
};

export default function SpeedTestBadge({ pageId, pageTitle, pagePath, size = "md" }: Props) {
  const [open, setOpen] = useState(false);
  const desktop = useMemo(() => generateMetrics(pageId, "desktop"), [pageId]);
  const mobile = useMemo(() => generateMetrics(pageId, "mobile"), [pageId]);

  const isSm = size === "sm";

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(true); }}
              className={`inline-flex items-center gap-1 rounded-md border bg-background hover:bg-muted transition-colors ${isSm ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"} font-medium`}
              aria-label={`Performance ${pageTitle}`}
            >
              <Monitor className={isSm ? "w-2.5 h-2.5 text-muted-foreground" : "w-3 h-3 text-muted-foreground"} />
              <span className={loadColor(desktop.loadTime, false)}>{desktop.loadTime.toFixed(1)}s</span>
              <span className="text-muted-foreground/60">·</span>
              <Smartphone className={isSm ? "w-2.5 h-2.5 text-muted-foreground" : "w-3 h-3 text-muted-foreground"} />
              <span className={loadColor(mobile.loadTime, true)}>{mobile.loadTime.toFixed(1)}s</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">Speedtest desktop / mobile — cliquez pour le détail</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              Speedtest — {pageTitle}
            </DialogTitle>
            <DialogDescription>
              Analyse de performance synthétique (méthodologie Lighthouse) pour <code className="px-1 py-0.5 bg-muted rounded text-xs">{pagePath}</code>
            </DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-4 mt-2">
            <DeviceCard device="desktop" metrics={desktop} />
            <DeviceCard device="mobile" metrics={mobile} />
          </div>

          <Suggestions desktop={desktop} mobile={mobile} />

          <div className="text-[11px] text-muted-foreground border-t pt-3">
            Mesures synthétiques générées localement pour donner un ordre de grandeur. Pour un audit précis, branchez l'API PageSpeed Insights.
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DeviceCard({ device, metrics }: { device: "desktop" | "mobile"; metrics: Metrics }) {
  const isMobile = device === "mobile";
  const Icon = isMobile ? Smartphone : Monitor;
  const sc = scoreColor(metrics.performanceScore);
  return (
    <div className="rounded-xl border p-4 bg-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{isMobile ? "Mobile" : "Desktop"}</span>
        </div>
        <div className={`flex items-center justify-center w-14 h-14 rounded-full ring-4 ${sc.ring} ${sc.bg}`}>
          <span className={`text-xl font-bold ${sc.text}`}>{metrics.performanceScore}</span>
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground mb-3">{sc.label} · score Lighthouse</div>

      <div className="space-y-2.5">
        <Metric label="Temps de chargement" value={`${metrics.loadTime.toFixed(2)} s`} pct={Math.min(100, (metrics.loadTime / (isMobile ? 5 : 4)) * 100)} good={metrics.loadTime <= (isMobile ? 2.5 : 1.5)} />
        <Metric label="First Contentful Paint" value={`${metrics.fcp.toFixed(2)} s`} pct={Math.min(100, (metrics.fcp / 3) * 100)} good={metrics.fcp <= 1.8} />
        <Metric label="Largest Contentful Paint" value={`${metrics.lcp.toFixed(2)} s`} pct={Math.min(100, (metrics.lcp / 5) * 100)} good={metrics.lcp <= 2.5} />
        <Metric label="Total Blocking Time" value={`${metrics.tbt} ms`} pct={Math.min(100, (metrics.tbt / 600) * 100)} good={metrics.tbt <= 200} />
        <Metric label="Cumulative Layout Shift" value={metrics.cls.toFixed(2)} pct={Math.min(100, (metrics.cls / 0.4) * 100)} good={metrics.cls <= 0.1} />
        <Metric label="Time To First Byte" value={`${metrics.ttfb} ms`} pct={Math.min(100, (metrics.ttfb / 800) * 100)} good={metrics.ttfb <= 300} />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t">
        <div className="text-xs">
          <div className="text-muted-foreground">Poids total</div>
          <div className="font-semibold">{(metrics.weight / 1024).toFixed(2)} MB</div>
        </div>
        <div className="text-xs">
          <div className="text-muted-foreground">Requêtes</div>
          <div className="font-semibold">{metrics.requests}</div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, pct, good }: { label: string; value: string; pct: number; good: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-medium ${good ? "text-green-600" : "text-orange-600"}`}>{value}</span>
      </div>
      <Progress value={pct} className={`h-1.5 ${good ? "[&>div]:bg-green-500" : "[&>div]:bg-orange-500"}`} />
    </div>
  );
}

function Suggestions({ desktop, mobile }: { desktop: Metrics; mobile: Metrics }) {
  const suggestions: { icon: any; title: string; desc: string; severity: "high" | "medium" | "low" }[] = [];

  if (mobile.lcp > 2.5 || desktop.lcp > 2)
    suggestions.push({
      icon: ImageIcon,
      title: "Optimiser le LCP (image héro)",
      desc: "Servez l'image principale en WebP/AVIF, ajoutez fetchpriority=\"high\", préchargez-la et limitez sa taille à la viewport.",
      severity: "high",
    });
  if (mobile.tbt > 200)
    suggestions.push({
      icon: Code2,
      title: "Réduire le JavaScript bloquant",
      desc: "Différer les scripts tiers (analytics, chatbot) avec defer/async, supprimer le code mort et code-splitter les routes lourdes.",
      severity: "high",
    });
  if (mobile.cls > 0.1)
    suggestions.push({
      icon: AlertTriangle,
      title: "Stabiliser la mise en page (CLS)",
      desc: "Réservez les dimensions des images/vidéos/iframes (width/height ou aspect-ratio) et évitez d'injecter des bannières au-dessus du contenu.",
      severity: "medium",
    });
  if (mobile.ttfb > 300 || desktop.ttfb > 220)
    suggestions.push({
      icon: Server,
      title: "Améliorer le TTFB",
      desc: "Activez le cache HTTP / CDN (edge) sur les pages publiques et mettez en cache les requêtes Supabase non personnalisées.",
      severity: "medium",
    });
  if (mobile.weight > 1800 || desktop.weight > 1500)
    suggestions.push({
      icon: Zap,
      title: "Alléger la page",
      desc: "Compressez les assets (Brotli), lazy-loadez les sections sous la ligne de flottaison et limitez les polices/icônes embarquées.",
      severity: "medium",
    });
  if (mobile.requests > 50)
    suggestions.push({
      icon: Wifi,
      title: "Réduire le nombre de requêtes",
      desc: "Bundlez les sprites SVG, regroupez les fonts et combinez les appels API en une RPC ou une vue Supabase.",
      severity: "low",
    });
  if (suggestions.length === 0)
    suggestions.push({
      icon: CheckCircle2,
      title: "Performance saine",
      desc: "Aucune optimisation critique détectée. Surveillez régulièrement le LCP mobile et la dette JS lors des évolutions.",
      severity: "low",
    });

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-amber-500" />
        <h3 className="font-semibold text-sm">Suggestions d'amélioration</h3>
        <Badge variant="secondary" className="text-[10px]">{suggestions.length}</Badge>
      </div>
      <div className="space-y-2">
        {suggestions.map((s, i) => {
          const Icon = s.icon;
          const color =
            s.severity === "high" ? "border-red-200 bg-red-50" :
            s.severity === "medium" ? "border-orange-200 bg-orange-50" :
            "border-emerald-200 bg-emerald-50";
          const iconColor =
            s.severity === "high" ? "text-red-600" :
            s.severity === "medium" ? "text-orange-600" :
            "text-emerald-600";
          return (
            <div key={i} className={`flex gap-3 p-3 rounded-lg border ${color}`}>
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
              <div>
                <div className="text-sm font-semibold">{s.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
