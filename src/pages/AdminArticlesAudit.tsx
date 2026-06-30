import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";

type Post = {
  id: string;
  slug: string;
  title: string;
  content_type: "actualite" | "guide" | "aide";
  published_at: string | null;
  updated_at: string | null;
  content: string;
};

type AuditResult = {
  ok: boolean;
  changed: boolean;
  audit: {
    interlinks_added?: string[];
    outdated_facts_corrected?: string[];
    remaining_issues?: string[];
    quality_score?: number;
    error?: string;
  };
  error?: string;
};

const detailUrl = (p: Post) => {
  if (p.content_type === "guide") return `/guide/${p.slug}`;
  if (p.content_type === "aide") return `/aide/${p.slug}`;
  return `/actualites/energie/${p.slug}`;
};

export default function AdminArticlesAudit() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [results, setResults] = useState<Record<string, AuditResult>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const [filter, setFilter] = useState<"all" | "actualite" | "guide" | "aide">("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("posts")
        .select("id,slug,title,content_type,published_at,updated_at,content")
        .eq("status", "published")
        .order("published_at", { ascending: true });
      setPosts((data || []) as Post[]);
    })();
  }, []);

  const enrichOne = async (post: Post): Promise<AuditResult> => {
    setRunning(post.id);
    try {
      const { data, error } = await supabase.functions.invoke("enrich-article", {
        body: { post_id: post.id },
      });
      if (error) throw error;
      const res = data as AuditResult;
      setResults((r) => ({ ...r, [post.id]: res }));
      return res;
    } catch (e: any) {
      const res: AuditResult = { ok: false, changed: false, audit: { error: e.message } };
      setResults((r) => ({ ...r, [post.id]: res }));
      return res;
    } finally {
      setRunning(null);
    }
  };

  const enrichAll = async () => {
    const targets = posts.filter((p) => filter === "all" || p.content_type === filter);
    setBatchRunning(true);
    setBatchProgress({ done: 0, total: targets.length });
    for (let i = 0; i < targets.length; i++) {
      const p = targets[i];
      toast.info(`Enrichissement ${i + 1}/${targets.length} : ${p.title.slice(0, 50)}…`);
      await enrichOne(p);
      setBatchProgress({ done: i + 1, total: targets.length });
    }
    setBatchRunning(false);
    toast.success("Audit terminé sur tous les articles.");
  };

  const visible = posts.filter((p) => filter === "all" || p.content_type === filter);

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/administration" className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Administration
          </Link>
          <h1 className="text-3xl font-bold mt-2">Audit & maillage interne des articles</h1>
          <p className="text-muted-foreground mt-1">
            Enrichit chaque article avec 3-5 liens internes contextuels, ajoute un bloc « Pour aller plus loin », corrige les chiffres périmés et liste les points à vérifier humainement.
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Lancement en lot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {(["all", "actualite", "guide", "aide"] as const).map((f) => (
              <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
                {f === "all" ? `Tous (${posts.length})` : `${f}s (${posts.filter((p) => p.content_type === f).length})`}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={enrichAll} disabled={batchRunning || visible.length === 0} className="gap-2">
              {batchRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Enrichir les {visible.length} {filter === "all" ? "contenus" : filter + "s"}
            </Button>
            {batchRunning && (
              <div className="flex-1">
                <Progress value={(batchProgress.done / Math.max(batchProgress.total, 1)) * 100} />
                <p className="text-xs text-muted-foreground mt-1">{batchProgress.done} / {batchProgress.total}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            ⚠️ Chaque enrichissement consomme des crédits IA. Le contenu est mis à jour en base, mais tout reste éditable depuis Gérer les actualités/guides.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {visible.map((post) => {
          const res = results[post.id];
          const isRunning = running === post.id;
          return (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{post.content_type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        publié {post.published_at?.slice(0, 10)}
                      </span>
                      {post.content.length < 2000 && (
                        <Badge variant="destructive" className="text-xs">contenu court ({post.content.length}c)</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold truncate">{post.title}</h3>
                    <a href={detailUrl(post)} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1">
                      {detailUrl(post)} <ExternalLink className="w-3 h-3" />
                    </a>

                    {res && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/40 border text-sm space-y-2">
                        {res.audit.error || res.error ? (
                          <p className="text-destructive">❌ {res.audit.error || res.error}</p>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              {res.changed ? (
                                <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                                  <CheckCircle2 className="w-3 h-3" /> Article mis à jour
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">Aucune modification</span>
                              )}
                              {typeof res.audit.quality_score === "number" && (
                                <Badge variant="secondary">Score qualité : {res.audit.quality_score}/100</Badge>
                              )}
                            </div>
                            {res.audit.interlinks_added?.length ? (
                              <div>
                                <p className="text-xs font-medium text-foreground/70">🔗 Liens internes ajoutés :</p>
                                <ul className="text-xs ml-4 list-disc">
                                  {res.audit.interlinks_added.map((l, i) => <li key={i}>{l}</li>)}
                                </ul>
                              </div>
                            ) : null}
                            {res.audit.outdated_facts_corrected?.length ? (
                              <div>
                                <p className="text-xs font-medium text-foreground/70">📅 Faits périmés corrigés :</p>
                                <ul className="text-xs ml-4 list-disc">
                                  {res.audit.outdated_facts_corrected.map((l, i) => <li key={i}>{l}</li>)}
                                </ul>
                              </div>
                            ) : null}
                            {res.audit.remaining_issues?.length ? (
                              <div>
                                <p className="text-xs font-medium text-amber-600 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> À vérifier humainement :
                                </p>
                                <ul className="text-xs ml-4 list-disc">
                                  {res.audit.remaining_issues.map((l, i) => <li key={i}>{l}</li>)}
                                </ul>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <Button size="sm" onClick={() => enrichOne(post)} disabled={isRunning || batchRunning} className="gap-2 shrink-0">
                    {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Enrichir
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
