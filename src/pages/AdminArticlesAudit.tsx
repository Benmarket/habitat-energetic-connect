import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ArrowUpDown,
  ArrowDownAZ,
  ArrowUpAZ,
  Calendar,
  Filter,
  X,
} from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  content_type: string;
};

type Tag = {
  id: string;
  name: string;
  slug: string;
  content_type: string;
};

type Post = {
  id: string;
  slug: string;
  title: string;
  content_type: "actualite" | "guide" | "aide";
  published_at: string | null;
  updated_at: string | null;
  created_at: string | null;
  content: string;
  featured_image: string | null;
  post_categories: { category_id: string; categories: Category | null }[];
  post_tags: { tag_id: string; tags: Tag | null }[];
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

type SortField = "published_at" | "updated_at" | "title" | "content_length" | "quality_score" | "issues_count";
type SortDir = "asc" | "desc";

type LengthFilter = "all" | "short" | "medium" | "long";

type IssuesFilter = "all" | "with_issues" | "without_issues" | "changed";

const detailUrl = (p: Post) => {
  if (p.content_type === "guide") return `/guide/${p.slug}`;
  if (p.content_type === "aide") return `/aide/${p.slug}`;
  return `/actualites/energie/${p.slug}`;
};

const lengthLabel: Record<LengthFilter, string> = {
  all: "Toutes tailles",
  short: "Court (< 2000 car)",
  medium: "Moyen (2000-4000 car)",
  long: "Long (> 4000 car)",
};

const issuesLabel: Record<IssuesFilter, string> = {
  all: "Tous états",
  with_issues: "Avec problèmes",
  without_issues: "Sans problèmes",
  changed: "Modifiés",
};

export default function AdminArticlesAudit() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [results, setResults] = useState<Record<string, AuditResult>>({});
  const [running, setRunning] = useState<string | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<"all" | "actualite" | "guide" | "aide">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [lengthFilter, setLengthFilter] = useState<LengthFilter>("all");
  const [issuesFilter, setIssuesFilter] = useState<IssuesFilter>("all");
  const [search, setSearch] = useState<string>("");

  const [sortField, setSortField] = useState<SortField>("published_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [postsRes, categoriesRes, tagsRes] = await Promise.all([
        supabase
          .from("posts")
          .select(
            `id,slug,title,content_type,published_at,created_at,updated_at,content,featured_image,
            post_categories(category_id,categories(id,name,slug,content_type)),
            post_tags(tag_id,tags(id,name,slug,content_type))`
          )
          .eq("status", "published"),
        supabase.from("categories").select("id,name,slug,content_type").order("content_type").order("name"),
        supabase.from("tags").select("id,name,slug,content_type").order("content_type").order("name"),
      ]);
      setPosts((postsRes.data || []) as unknown as Post[]);
      setAllCategories((categoriesRes.data || []) as Category[]);
      setAllTags((tagsRes.data || []) as Tag[]);
      setLoading(false);
    })();
  }, []);

  const categoriesForType = useMemo(() => {
    if (filter === "all") return allCategories;
    return allCategories.filter((c) => c.content_type === filter);
  }, [allCategories, filter]);

  const tagsForType = useMemo(() => {
    if (filter === "all") return allTags;
    return allTags.filter((t) => t.content_type === filter);
  }, [allTags, filter]);

  const postCategories = (p: Post) =>
    p.post_categories
      ?.map((c) => c.categories?.name)
      .filter(Boolean) as string[];

  const postTags = (p: Post) =>
    p.post_tags?.map((t) => t.tags?.name).filter(Boolean) as string[];

  const filtered = useMemo(() => {
    let out = posts.filter((p) => {
      if (filter !== "all" && p.content_type !== filter) return false;
      if (categoryFilter !== "all" && !postCategories(p).includes(categoryFilter)) return false;
      if (tagFilter !== "all" && !postTags(p).includes(tagFilter)) return false;
      if (dateFrom && p.published_at && new Date(p.published_at) < new Date(dateFrom)) return false;
      if (dateTo && p.published_at && new Date(p.published_at) > new Date(dateTo + "T23:59:59")) return false;
      if (lengthFilter === "short" && p.content.length >= 2000) return false;
      if (lengthFilter === "medium" && (p.content.length < 2000 || p.content.length > 4000)) return false;
      if (lengthFilter === "long" && p.content.length <= 4000) return false;
      if (issuesFilter !== "all") {
        const r = results[p.id];
        const hasIssues = Boolean(r?.audit?.remaining_issues?.length || r?.audit?.error || r?.error);
        const changed = r?.changed;
        if (issuesFilter === "with_issues" && !hasIssues) return false;
        if (issuesFilter === "without_issues" && hasIssues) return false;
        if (issuesFilter === "changed" && !changed) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const inTitle = p.title.toLowerCase().includes(q);
        const inSlug = p.slug.toLowerCase().includes(q);
        const inCats = postCategories(p).some((c) => c.toLowerCase().includes(q));
        const inTags = postTags(p).some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inSlug && !inCats && !inTags) return false;
      }
      return true;
    });

    out = out.sort((a, b) => {
      let valA: number | string = "";
      let valB: number | string = "";
      switch (sortField) {
        case "title":
          valA = a.title.toLowerCase();
          valB = b.title.toLowerCase();
          break;
        case "content_length":
          valA = a.content.length;
          valB = b.content.length;
          break;
        case "quality_score":
          valA = results[a.id]?.audit?.quality_score ?? -1;
          valB = results[b.id]?.audit?.quality_score ?? -1;
          break;
        case "issues_count":
          valA = results[a.id]?.audit?.remaining_issues?.length ?? 999;
          valB = results[b.id]?.audit?.remaining_issues?.length ?? 999;
          break;
        case "updated_at":
          valA = a.updated_at || a.created_at || "";
          valB = b.updated_at || b.created_at || "";
          break;
        case "published_at":
        default:
          valA = a.published_at || "";
          valB = b.published_at || "";
      }
      if (typeof valA === "string" && typeof valB === "string") {
        return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return out;
  }, [posts, filter, categoryFilter, tagFilter, dateFrom, dateTo, lengthFilter, issuesFilter, search, sortField, sortDir, results]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filter !== "all") count++;
    if (categoryFilter !== "all") count++;
    if (tagFilter !== "all") count++;
    if (dateFrom) count++;
    if (dateTo) count++;
    if (lengthFilter !== "all") count++;
    if (issuesFilter !== "all") count++;
    if (search) count++;
    return count;
  }, [filter, categoryFilter, tagFilter, dateFrom, dateTo, lengthFilter, issuesFilter, search]);

  const resetFilters = () => {
    setFilter("all");
    setCategoryFilter("all");
    setTagFilter("all");
    setDateFrom("");
    setDateTo("");
    setLengthFilter("all");
    setIssuesFilter("all");
    setSearch("");
    setSortField("published_at");
    setSortDir("desc");
  };

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
    const targets = filtered;
    setBatchRunning(true);
    setBatchProgress({ done: 0, total: targets.length });
    for (let i = 0; i < targets.length; i++) {
      const p = targets[i];
      toast.info(`Enrichissement ${i + 1}/${targets.length} : ${p.title.slice(0, 50)}…`);
      await enrichOne(p);
      setBatchProgress({ done: i + 1, total: targets.length });
    }
    setBatchRunning(false);
    toast.success("Audit terminé sur tous les articles visibles.");
  };

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
            <Filter className="w-5 h-5 text-primary" /> Filtres & classement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <Select value={filter} onValueChange={(v) => { setFilter(v as any); setCategoryFilter("all"); setTagFilter("all"); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous ({posts.length})</SelectItem>
                  <SelectItem value="actualite">Actualités ({posts.filter((p) => p.content_type === "actualite").length})</SelectItem>
                  <SelectItem value="guide">Guides ({posts.filter((p) => p.content_type === "guide").length})</SelectItem>
                  <SelectItem value="aide">Aides ({posts.filter((p) => p.content_type === "aide").length})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Catégorie</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {categoriesForType.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name} <span className="text-muted-foreground">({c.content_type})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Étiquette</label>
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Étiquette" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {tagsForType.map((t) => (
                    <SelectItem key={t.id} value={t.name}>
                      {t.name} <span className="text-muted-foreground">({t.content_type})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Taille du contenu</label>
              <Select value={lengthFilter} onValueChange={(v) => setLengthFilter(v as LengthFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Taille" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(lengthLabel) as LengthFilter[]).map((k) => (
                    <SelectItem key={k} value={k}>{lengthLabel[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Depuis</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="pl-9" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Jusqu'à</label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="pl-9" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">État d'audit</label>
              <Select value={issuesFilter} onValueChange={(v) => setIssuesFilter(v as IssuesFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="État" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(issuesLabel) as IssuesFilter[]).map((k) => (
                    <SelectItem key={k} value={k}>{issuesLabel[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Recherche</label>
              <Input
                placeholder="Titre, slug, catégorie, tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between border-t pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Trier par</span>
                <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published_at">Date de publication</SelectItem>
                    <SelectItem value="updated_at">Date de mise à jour</SelectItem>
                    <SelectItem value="title">Titre</SelectItem>
                    <SelectItem value="content_length">Taille du contenu</SelectItem>
                    <SelectItem value="quality_score">Score qualité</SelectItem>
                    <SelectItem value="issues_count">Nombre de problèmes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                title={sortDir === "asc" ? "Croissant" : "Décroissant"}
              >
                {sortDir === "asc" ? <ArrowUpAZ className="w-4 h-4" /> : <ArrowDownAZ className="w-4 h-4" />}
              </Button>

              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground">
                  <X className="w-3 h-3" /> Réinitialiser ({activeFiltersCount})
                </Button>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              {filtered.length} article{filtered.length > 1 ? "s" : ""} visibl
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Lancement en lot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={enrichAll} disabled={batchRunning || filtered.length === 0} className="gap-2">
              {batchRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Enrichir les {filtered.length} visibles
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
        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Chargement des articles...
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Aucun article ne correspond aux filtres sélectionnés.
          </div>
        )}
        {filtered.map((post) => {
          const res = results[post.id];
          const isRunning = running === post.id;
          const cats = postCategories(post);
          const tags = postTags(post);
          return (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {post.content_type !== "aide" && (
                    <a
                      href={detailUrl(post)}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 hidden sm:block"
                    >
                      {post.featured_image ? (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-24 h-16 object-cover rounded-lg border bg-muted"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-24 h-16 rounded-lg border bg-muted flex items-center justify-center text-muted-foreground text-xs text-center px-2">
                          Pas d'image
                        </div>
                      )}
                    </a>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant="outline">{post.content_type}</Badge>
                      {cats.map((c) => (
                        <Badge key={c} variant="secondary" className="text-xs font-normal">{c}</Badge>
                      ))}
                      <span className="text-xs text-muted-foreground">
                        publié {post.published_at?.slice(0, 10)}
                      </span>
                      {post.content.length < 2000 && (
                        <Badge variant="destructive" className="text-xs">contenu court ({post.content.length}c)</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold truncate">{post.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <a href={detailUrl(post)} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                        {detailUrl(post)} <ExternalLink className="w-3 h-3" />
                      </a>
                      {tags.length > 0 && (
                        <span className="flex items-center gap-1">
                          · Étiquettes : {tags.join(", ")}
                        </span>
                      )}
                    </div>

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
