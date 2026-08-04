import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sitemap`;

const parseLocs = (xml: string): string[] =>
  Array.from(xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)).map((m) =>
    m[1].replace(/^https?:\/\/[^/]+/, ""),
  );

const SitemapStatusCard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deployed, setDeployed] = useState<string[]>([]);
  const [live, setLive] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [depRes, liveRes] = await Promise.all([
        fetch(`/sitemap.xml?ts=${Date.now()}`),
        fetch(FN_URL),
      ]);
      const [depXml, liveXml] = await Promise.all([depRes.text(), liveRes.text()]);
      setDeployed(parseLocs(depXml));
      setLive(parseLocs(liveXml));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const deployedSet = new Set(deployed);
  const liveSet = new Set(live);
  const missing = live.filter((u) => !deployedSet.has(u));
  const obsolete = deployed.filter((u) => !liveSet.has(u));
  const inSync = !loading && !error && missing.length === 0 && obsolete.length === 0;

  return (
    <Card className={inSync ? "border-emerald-500/40" : "border-amber-500/50"}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : inSync ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
            Sitemap — état de synchronisation
          </CardTitle>
          <CardDescription>
            Le sitemap servi aux moteurs est un fichier statique régénéré à chaque publication du
            site. Ce bloc compare son contenu avec les URLs réellement publiées en base.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Vérifier
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={FN_URL} target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" /> Voir à jour
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="text-sm text-destructive">Vérification impossible : {error}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="URLs en base" value={live.length} />
              <Stat label="URLs dans le sitemap servi" value={deployed.length} />
              <Stat label="Manquantes" value={missing.length} tone={missing.length ? "warn" : "ok"} />
              <Stat label="Obsolètes" value={obsolete.length} tone={obsolete.length ? "warn" : "ok"} />
            </div>

            {inSync && (
              <p className="text-sm text-emerald-600">
                Sitemap à jour : toutes les pages publiées sont déclarées.
              </p>
            )}

            {(missing.length > 0 || obsolete.length > 0) && (
              <div className="rounded-lg border bg-amber-500/5 p-4 space-y-3">
                <p className="text-sm">
                  Du contenu a été publié depuis la dernière mise en ligne du site.{" "}
                  <strong>Republie le site</strong> (bouton Publish) : le sitemap est régénéré
                  automatiquement à partir de la base au moment du build.
                </p>
                {missing.length > 0 && (
                  <UrlList title="À ajouter" urls={missing} />
                )}
                {obsolete.length > 0 && (
                  <UrlList title="À retirer" urls={obsolete} />
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

const Stat = ({ label, value, tone }: { label: string; value: number; tone?: "ok" | "warn" }) => (
  <div className="rounded-lg border bg-card p-3">
    <div
      className={`text-2xl font-bold ${
        tone === "warn" ? "text-amber-600" : tone === "ok" ? "text-emerald-600" : "text-foreground"
      }`}
    >
      {value}
    </div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

const UrlList = ({ title, urls }: { title: string; urls: string[] }) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      <Badge variant="outline">{title}</Badge>
      <span className="text-xs text-muted-foreground">{urls.length} URL(s)</span>
    </div>
    <ul className="max-h-40 overflow-y-auto space-y-1 text-xs font-mono">
      {urls.map((u) => (
        <li key={u} className="truncate text-muted-foreground">
          {u}
        </li>
      ))}
    </ul>
  </div>
);

export default SitemapStatusCard;
