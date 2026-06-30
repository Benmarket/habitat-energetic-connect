import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, ArrowUpDown, Eye, EyeOff, Send, Library, Calendar, Bot, FileSearch, DollarSign, BarChart3, Clock, Sparkles, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { ButtonPresetsLibrary } from "@/components/ButtonPresetsLibrary";
import { SchedulePublishModal } from "@/components/SchedulePublishModal";
import { AIAutomationModal } from "@/components/AIAutomationModal";
import { ArticlePreviewModal } from "@/components/ArticlePreviewModal";

const ManageActualites = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [articleStats, setArticleStats] = useState<Record<string, { views: number; avgDuration: number | null }>>({});
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [periodFilter, setPeriodFilter] = useState<"all" | "month" | "year">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "archived">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [buttonLibraryOpen, setButtonLibraryOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedPostForSchedule, setSelectedPostForSchedule] = useState<{
    id: string;
    scheduledDate: string | null;
  } | null>(null);
  const [aiAutomationOpen, setAiAutomationOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedPostForPreview, setSelectedPostForPreview] = useState<any>(null);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [auditReport, setAuditReport] = useState<{ title: string; data: any } | null>(null);
  const [bulkRunning, setBulkRunning] = useState<null | "full" | "audit_only">(null);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, ok: 0, changed: 0, errors: 0 });
  const [bulkSummary, setBulkSummary] = useState<any[] | null>(null);

  const runEnrich = async (postId: string, postTitle: string, mode: "full" | "audit_only") => {
    setEnrichingId(postId);
    try {
      const { data, error } = await supabase.functions.invoke("enrich-article", {
        body: { post_id: postId, mode },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAuditReport({ title: postTitle, data });
      if (mode === "full" && data?.changed) toast.success("Article enrichi avec succès");
      else if (mode === "audit_only") toast.success("Audit terminé");
      else toast.info("Aucune modification nécessaire");
      if (mode === "full") fetchPosts();
    } catch (e: any) {
      toast.error("Erreur : " + (e.message || String(e)));
    } finally {
      setEnrichingId(null);
    }
  };

  const runBulk = async (mode: "full" | "audit_only") => {
    const targets = posts.filter((p) => p.status === "published");
    if (targets.length === 0) { toast.info("Aucun article publié à traiter"); return; }
    if (!window.confirm(
      `${mode === "full" ? "Enrichir" : "Auditer"} ${targets.length} article(s) publié(s) ?\n` +
      (mode === "full" ? "Le contenu sera modifié en base (corrections IA, maillage, CTA)." : "Audit en lecture seule.")
    )) return;

    setBulkRunning(mode);
    setBulkProgress({ done: 0, total: targets.length, ok: 0, changed: 0, errors: 0 });
    const summary: any[] = [];
    const CONCURRENCY = 3;
    let idx = 0;

    const worker = async () => {
      while (idx < targets.length) {
        const i = idx++;
        const p = targets[i];
        try {
          const { data, error } = await supabase.functions.invoke("enrich-article", {
            body: { post_id: p.id, mode },
          });
          if (error || data?.error) throw new Error(error?.message || data?.error);
          summary.push({ title: p.title, slug: p.slug, ok: true, changed: !!data?.changed, audit: data?.audit });
          setBulkProgress((s) => ({ ...s, done: s.done + 1, ok: s.ok + 1, changed: s.changed + (data?.changed ? 1 : 0) }));
        } catch (e: any) {
          summary.push({ title: p.title, slug: p.slug, ok: false, error: e.message });
          setBulkProgress((s) => ({ ...s, done: s.done + 1, errors: s.errors + 1 }));
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    setBulkRunning(null);
    setBulkSummary(summary);
    toast.success(`Traitement terminé : ${summary.filter(s => s.ok).length}/${targets.length} OK`);
    if (mode === "full") fetchPosts();
  };


  useEffect(() => {
    const checkAuth = async () => {
      if (!authLoading && !user) {
        navigate("/connexion");
        return;
      }
      
      if (user) {
        // Vérifier que l'utilisateur a un rôle admin ou super_admin
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        
        const hasAdminAccess = roles?.some(r => r.role === "admin" || r.role === "super_admin");
        if (!hasAdminAccess) {
          navigate("/");
        }
      }
    };
    checkAuth();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user, sortOrder, periodFilter, statusFilter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("posts")
        .select(`
          *,
          post_categories(
            categories(id, name, slug)
          )
        `)
        .eq("content_type", "actualite");

      // Filtrer par statut
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      
      query = query.order("published_at", { ascending: sortOrder === "asc", nullsFirst: false });

      // Apply period filter
      if (periodFilter === "month") {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        query = query.gte("published_at", firstDayOfMonth.toISOString());
      } else if (periodFilter === "year") {
        const now = new Date();
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
        query = query.gte("published_at", firstDayOfYear.toISOString());
      }

      const { data, error } = await query;
      
      if (error) throw error;
      if (data) {
        setPosts(data);
        // Fetch article view stats
        fetchArticleStats(data);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Erreur lors du chargement des actualités");
    } finally {
      setLoading(false);
    }
  };

  const fetchArticleStats = async (postsData: any[]) => {
    try {
      const slugs = postsData.map(p => `/actualites/${p.post_categories?.[0]?.categories?.slug || 'general'}/${p.slug}`);
      
      // Fetch all page_views for article URLs
      const { data: viewsData } = await supabase
        .from("page_views")
        .select("page_url, duration_seconds")
        .in("page_url", slugs);
      
      if (!viewsData) return;

      // Aggregate by page_url
      const statsMap: Record<string, { views: number; totalDuration: number; durationCount: number }> = {};
      viewsData.forEach((pv: any) => {
        if (!statsMap[pv.page_url]) {
          statsMap[pv.page_url] = { views: 0, totalDuration: 0, durationCount: 0 };
        }
        statsMap[pv.page_url].views++;
        if (pv.duration_seconds && pv.duration_seconds > 0) {
          statsMap[pv.page_url].totalDuration += pv.duration_seconds;
          statsMap[pv.page_url].durationCount++;
        }
      });

      // Map back to post IDs
      const result: Record<string, { views: number; avgDuration: number | null }> = {};
      postsData.forEach(post => {
        const url = `/actualites/${post.post_categories?.[0]?.categories?.slug || 'general'}/${post.slug}`;
        const stat = statsMap[url];
        result[post.id] = {
          views: stat?.views || 0,
          avgDuration: stat?.durationCount ? Math.round(stat.totalDuration / stat.durationCount) : null,
        };
      });
      
      setArticleStats(result);
    } catch (error) {
      console.error("Error fetching article stats:", error);
    }
  };

  const handleDelete = async () => {
    if (!postToDelete) return;

    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postToDelete);

      if (error) throw error;

      toast.success("Actualité supprimée avec succès");
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  };

  const confirmDelete = (postId: string) => {
    setPostToDelete(postId);
    setDeleteDialogOpen(true);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === "desc" ? "asc" : "desc");
  };

  const handleStatusChange = async (postId: string, newStatus: "published" | "archived") => {
    try {
      const updateData: any = { status: newStatus };
      
      // Si on publie, on met la date de publication
      if (newStatus === "published") {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("posts")
        .update(updateData)
        .eq("id", postId);

      if (error) throw error;

      toast.success(
        newStatus === "published" 
          ? "Article publié avec succès" 
          : "Article désactivé avec succès"
      );
      fetchPosts();
    } catch (error) {
      console.error("Error updating post status:", error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  // Pagination
  const totalPages = itemsPerPage === 999999 
    ? 1 
    : Math.ceil(posts.length / itemsPerPage);
  
  const paginatedPosts = itemsPerPage === 999999 
    ? posts 
    : posts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gérer les actualités | Prime Énergies</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Gérer les actualités</h1>
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={() => runBulk("audit_only")}
                  variant="outline"
                  className="gap-2"
                  disabled={!!bulkRunning || loading}
                  title="Audit heuristique (gratuit, sans IA, sans modification)"
                >
                  {bulkRunning === "audit_only" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Auditer tout
                </Button>
                <Button
                  onClick={() => runBulk("full")}
                  className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white"
                  disabled={!!bulkRunning || loading}
                  title="Enrichir tous les articles publiés (IA — consomme des crédits)"
                >
                  {bulkRunning === "full" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Enrichir tout (IA)
                </Button>
                <Link to="/admin/articles-audit">
                  <Button variant="outline" className="gap-2">
                    <FileSearch className="w-4 h-4" />
                    Page d'audit dédiée
                  </Button>
                </Link>
                <Button
                  onClick={() => setAiAutomationOpen(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Bot className="w-4 h-4" />
                  Programmer la diffusion articles IA
                </Button>
                <Button
                  onClick={() => setButtonLibraryOpen(true)}
                  className="gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                    color: '#ffffff',
                  }}
                >
                  <Library className="w-4 h-4" />
                  Mes boutons
                </Button>
                <Link to="/creer-contenu?type=actualite">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Créer une actualité
                  </Button>
                </Link>
              </div>
            </div>

            {bulkRunning && (
              <Card className="p-4 mb-4 border-violet-200 bg-violet-50/50">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {bulkRunning === "full" ? "Enrichissement IA en cours" : "Audit en cours"} — {bulkProgress.done}/{bulkProgress.total}
                    </p>
                    <div className="h-2 bg-violet-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-violet-600 transition-all" style={{ width: `${(bulkProgress.done / Math.max(bulkProgress.total,1)) * 100}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ✅ {bulkProgress.ok} OK · ✏️ {bulkProgress.changed} modifiés · ❌ {bulkProgress.errors} erreurs
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Filters and controls */}
            <Card className="p-4 mb-6">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Afficher:</span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => {
                      setItemsPerPage(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="999999">Max</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Période:</span>
                  <Select value={periodFilter} onValueChange={(value: any) => setPeriodFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tout</SelectItem>
                      <SelectItem value="month">Ce mois</SelectItem>
                      <SelectItem value="year">Cette année</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Statut:</span>
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="published">En ligne</SelectItem>
                      <SelectItem value="archived">Hors ligne</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleSortOrder}
                  className="gap-2"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  {sortOrder === "desc" ? "Plus récent" : "Plus ancien"}
                </Button>
              </div>
            </Card>

            {/* Table */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">Aucune actualité trouvée</p>
              </Card>
            ) : (
              <>
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Image</TableHead>
                        <TableHead>Titre</TableHead>
                        <TableHead className="w-32">Catégorie</TableHead>
                        <TableHead className="w-16 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <BarChart3 className="w-3.5 h-3.5" />
                            Vues
                          </div>
                        </TableHead>
                        <TableHead className="w-24 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Durée moy.
                          </div>
                        </TableHead>
                        <TableHead className="w-24">Source</TableHead>
                        <TableHead className="w-20">Coût</TableHead>
                        <TableHead className="w-32">Statut</TableHead>
                        <TableHead className="w-40">Date</TableHead>
                        <TableHead className="w-40">Édité le</TableHead>
                        <TableHead className="w-24 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPosts.map((post) => {
                        const rowClass = 
                          post.status === "draft" ? "bg-gray-100" : 
                          post.status === "archived" ? "bg-red-50" : 
                          "bg-white";
                        
                        return (
                          <TableRow key={post.id} className={rowClass}>
                            <TableCell>
                              {post.featured_image && (
                                <img
                                  src={post.featured_image}
                                  alt={post.title}
                                  className="w-16 h-12 object-cover rounded"
                                />
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{post.title}</TableCell>
                            <TableCell>
                              {post.post_categories?.[0]?.categories?.name || "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {(() => {
                                const views = articleStats[post.id]?.views || 0;
                                return (
                                  <span className={`text-sm font-semibold ${views > 100 ? 'text-green-600' : views > 20 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                                    {views > 0 ? views.toLocaleString('fr-FR') : '—'}
                                  </span>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-center">
                              {(() => {
                                const avg = articleStats[post.id]?.avgDuration;
                                if (!avg) return <span className="text-xs text-muted-foreground">—</span>;
                                const minutes = Math.floor(avg / 60);
                                const seconds = avg % 60;
                                const color = avg > 180 ? 'text-green-600' : avg > 60 ? 'text-blue-600' : 'text-orange-500';
                                return (
                                  <span className={`text-sm font-medium ${color}`}>
                                    {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
                                  </span>
                                );
                              })()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {post.source === "ai_auto" ? "IA Auto" : "Manuel"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {post.generation_cost != null ? (
                                <span className="text-xs font-mono text-muted-foreground">
                                  ${Number(post.generation_cost).toFixed(4)}
                                </span>
                              ) : (
                                <button
                                  className="text-xs text-muted-foreground/50 hover:text-muted-foreground cursor-pointer"
                                  onClick={async () => {
                                    const cost = prompt("Coût de génération ($) :", "0");
                                    if (cost === null) return;
                                    const numCost = parseFloat(cost);
                                    if (isNaN(numCost)) return;
                                    await supabase.from("posts").update({ generation_cost: numCost } as any).eq("id", post.id);
                                    fetchPosts();
                                  }}
                                  title="Cliquer pour saisir le coût"
                                >
                                  —
                                </button>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    post.status === "published"
                                      ? "bg-green-100 text-green-800"
                                      : post.status === "draft"
                                      ? "bg-gray-200 text-gray-800"
                                      : "bg-red-200 text-red-800"
                                  }`}
                                >
                                  {post.status === "published" ? "En ligne" : post.status === "draft" ? "Brouillon" : "Hors ligne"}
                                </span>
                                {post.scheduled_publish_at && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    {format(
                                      new Date(post.scheduled_publish_at),
                                      "d MMM yyyy HH:mm",
                                      { locale: fr }
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {post.published_at
                                ? format(new Date(post.published_at), "d MMM yyyy", { locale: fr })
                                : format(new Date(post.created_at), "d MMM yyyy", { locale: fr })}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {post.updated_at && post.updated_at !== post.created_at
                                ? format(new Date(post.updated_at), "d MMM yyyy 'à' HH:mm", { locale: fr })
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-purple-600 hover:bg-purple-50"
                                  onClick={() => {
                                    setSelectedPostForPreview(post);
                                    setPreviewModalOpen(true);
                                  }}
                                  title="Prévisualiser"
                                >
                                  <FileSearch className="w-4 h-4" />
                                </Button>
                                {post.status === "draft" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => {
                                        setSelectedPostForSchedule({
                                          id: post.id,
                                          scheduledDate: post.scheduled_publish_at,
                                        });
                                        setScheduleModalOpen(true);
                                      }}
                                      title="Programmer"
                                    >
                                      <Calendar className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 text-green-600 hover:bg-green-50"
                                      onClick={() => handleStatusChange(post.id, "published")}
                                      title="Publier"
                                    >
                                      <Send className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                {post.status === "published" && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-orange-600 hover:bg-orange-50"
                                    onClick={() => handleStatusChange(post.id, "archived")}
                                    title="Désactiver"
                                  >
                                    <EyeOff className="w-4 h-4" />
                                  </Button>
                                )}
                                {post.status === "archived" && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                    onClick={() => handleStatusChange(post.id, "published")}
                                    title="Réactiver"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                )}
                                <Link to={`/creer-contenu?type=actualite&edit=${post.id}`}>
                                  <Button variant="outline" size="icon" className="h-8 w-8">
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-violet-600 hover:bg-violet-50"
                                  title="Enrichir (maillage + audit + corrections IA)"
                                  disabled={enrichingId === post.id}
                                  onClick={() => runEnrich(post.id, post.title, "full")}
                                >
                                  {enrichingId === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                                  title="Auditer seulement (sans modifier le contenu)"
                                  disabled={enrichingId === post.id}
                                  onClick={() => runEnrich(post.id, post.title, "audit_only")}
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={() => confirmDelete(post.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>


                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Précédent
                    </Button>
                    <div className="flex items-center gap-2 px-4">
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} sur {totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        <Footer />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette actualité ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Button Library */}
      <ButtonPresetsLibrary
        open={buttonLibraryOpen}
        onOpenChange={setButtonLibraryOpen}
      />

      {/* Schedule Publish Modal */}
      {selectedPostForSchedule && (
        <SchedulePublishModal
          open={scheduleModalOpen}
          onOpenChange={setScheduleModalOpen}
          postId={selectedPostForSchedule.id}
          currentScheduledDate={selectedPostForSchedule.scheduledDate}
          onScheduled={() => {
            fetchPosts();
            setSelectedPostForSchedule(null);
          }}
        />
      )}

      {/* AI Automation Modal */}
      <AIAutomationModal
        open={aiAutomationOpen}
        onOpenChange={setAiAutomationOpen}
      />

      {/* Preview Modal */}
      {selectedPostForPreview && (
        <ArticlePreviewModal
          open={previewModalOpen}
          onOpenChange={(open) => {
            setPreviewModalOpen(open);
            if (!open) setSelectedPostForPreview(null);
          }}
          title={selectedPostForPreview.title}
          content={selectedPostForPreview.content}
          featuredImage={selectedPostForPreview.featured_image}
          excerpt={selectedPostForPreview.excerpt}
          focusKeywords={selectedPostForPreview.focus_keywords || []}
          metaTitle={selectedPostForPreview.meta_title}
          metaDescription={selectedPostForPreview.meta_description}
          contentType="actualite"
          tldr={selectedPostForPreview.tldr}
          faq={selectedPostForPreview.faq}
          categoryName={selectedPostForPreview.post_categories?.[0]?.categories?.name}
        />
      )}

      {/* Audit / Enrich report */}
      <AlertDialog open={!!auditReport} onOpenChange={(o) => !o && setAuditReport(null)}>
        <AlertDialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-left">Rapport — {auditReport?.title}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-left">
                {auditReport?.data?.changed && (
                  <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                    ✓ Contenu mis à jour en base
                  </div>
                )}
                {(() => {
                  const a = auditReport?.data?.audit || {};
                  const h = a.heuristic || {};
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded">
                        <div>Score qualité : <b>{a.quality_score ?? "-"}/100</b></div>
                        <div>Longueur : <b>{h.stats?.length ?? "-"}</b></div>
                        <div>Liens internes : <b>{h.stats?.links_internal ?? 0}</b></div>
                        <div>Liens externes : <b>{h.stats?.links_external ?? 0}</b></div>
                        <div>Images : <b>{h.stats?.images_inline ?? 0}</b></div>
                        <div>Tableaux : <b>{h.stats?.tables ?? 0}</b></div>
                        <div>H2 : <b>{h.stats?.h2_count ?? 0}</b></div>
                        <div>Bandeaux CTA : <b>{h.stats?.cta_banners ?? 0}</b></div>
                      </div>
                      {a.interlinks_added?.length > 0 && (
                        <div><b className="text-violet-700">Maillage ajouté :</b><ul className="list-disc pl-5">{a.interlinks_added.map((x: string, i: number) => <li key={i}><code className="text-xs">{x}</code></li>)}</ul></div>
                      )}
                      {a.ctas_fixed?.length > 0 && (
                        <div><b className="text-emerald-700">CTA / liens corrigés :</b><ul className="list-disc pl-5">{a.ctas_fixed.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></div>
                      )}
                      {a.images_alt_added > 0 && <div><b>Alt ajoutés :</b> {a.images_alt_added}</div>}
                      {a.outdated_facts_corrected?.length > 0 && (
                        <div><b className="text-blue-700">Faits périmés corrigés :</b><ul className="list-disc pl-5">{a.outdated_facts_corrected.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></div>
                      )}
                      {a.numbers_normalized?.length > 0 && (
                        <div><b>Chiffres normalisés :</b><ul className="list-disc pl-5">{a.numbers_normalized.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></div>
                      )}
                      {a.tables_fixed > 0 && <div><b>Tableaux corrigés :</b> {a.tables_fixed}</div>}
                      {h.issues?.length > 0 && (
                        <div><b className="text-red-700">❌ Problèmes critiques :</b><ul className="list-disc pl-5">{h.issues.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></div>
                      )}
                      {h.warnings?.length > 0 && (
                        <div><b className="text-amber-700">⚠️ Avertissements :</b><ul className="list-disc pl-5">{h.warnings.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></div>
                      )}
                      {a.veracity_flags?.length > 0 && (
                        <div><b className="text-orange-700">🔎 À fact-checker manuellement :</b><ul className="list-disc pl-5">{a.veracity_flags.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></div>
                      )}
                      {a.remaining_issues?.length > 0 && (
                        <div><b>Points restants :</b><ul className="list-disc pl-5">{a.remaining_issues.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul></div>
                      )}
                    </>
                  );
                })()}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAuditReport(null)}>Fermer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>

  );
};

export default ManageActualites;
