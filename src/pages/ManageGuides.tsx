import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Loader2, Plus, Pencil, Trash2, ArrowUpDown, Eye, EyeOff, Send, Library, Lock, Unlock, BookOpen, Star, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { ButtonPresetsLibrary } from "@/components/ButtonPresetsLibrary";

const ManageGuides = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [periodFilter, setPeriodFilter] = useState<"all" | "month" | "year">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft" | "archived">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [buttonLibraryOpen, setButtonLibraryOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!authLoading && !user) {
        navigate("/connexion");
        return;
      }
      
      if (user) {
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
        .eq("content_type", "guide");

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      
      query = query.order("published_at", { ascending: sortOrder === "asc", nullsFirst: false });

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
      if (data) setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Erreur lors du chargement des guides");
    } finally {
      setLoading(false);
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

      toast.success("Guide supprimé avec succès");
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
          ? "Guide publié avec succès" 
          : "Guide désactivé avec succès"
      );
      fetchPosts();
    } catch (error) {
      console.error("Error updating post status:", error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

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
        <title>Gérer les guides | Prime Énergies</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Gérer les guides</h1>
              <div className="flex gap-3">
                <Button
                  onClick={() => setButtonLibraryOpen(true)}
                  className="gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                    color: '#ffffff',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #8b5cf6, #ec4899)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ec4899, #8b5cf6)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Library className="w-4 h-4" />
                  Mes boutons
                </Button>
                <Link to="/creer-contenu?type=guide">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Créer un guide
                  </Button>
                </Link>
              </div>
            </div>

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
                <p className="text-muted-foreground">Aucun guide trouvé</p>
              </Card>
            ) : (
              <>
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Image</TableHead>
                        <TableHead>Titre</TableHead>
                        <TableHead className="w-28">Template</TableHead>
                        <TableHead className="w-24">Accès</TableHead>
                        <TableHead className="w-32">Catégorie</TableHead>
                        <TableHead className="w-32">Statut</TableHead>
                        <TableHead className="w-40">Date</TableHead>
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
                              {post.guide_template === 'premium' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                  <Star className="w-3 h-3" />
                                  Premium
                                </span>
                              ) : post.guide_template === 'expert' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                  <GraduationCap className="w-3 h-3" />
                                  Expert
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                  <BookOpen className="w-3 h-3" />
                                  Classique
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {post.is_members_only ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                  <Lock className="w-3 h-3" />
                                  Membres
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                  <Unlock className="w-3 h-3" />
                                  Public
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {post.post_categories?.[0]?.categories?.name || "-"}
                            </TableCell>
                            <TableCell>
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
                            </TableCell>
                            <TableCell>
                              {post.published_at
                                ? format(new Date(post.published_at), "d MMM yyyy", { locale: fr })
                                : format(new Date(post.created_at), "d MMM yyyy", { locale: fr })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                {post.status === "draft" && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-green-600 hover:bg-green-50"
                                    onClick={() => handleStatusChange(post.id, "published")}
                                    title="Publier"
                                  >
                                    <Send className="w-4 h-4" />
                                  </Button>
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
                                <Link to={`/creer-contenu?type=guide&edit=${post.id}`}>
                                  <Button variant="outline" size="icon" className="h-8 w-8">
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                </Link>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce guide ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ButtonPresetsLibrary
        open={buttonLibraryOpen}
        onOpenChange={setButtonLibraryOpen}
      />
    </>
  );
};

export default ManageGuides;
