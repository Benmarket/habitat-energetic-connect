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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, ArrowUpDown, Eye, EyeOff, Send, Library, Star } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { ButtonPresetsLibrary } from "@/components/ButtonPresetsLibrary";

const ManageAides = () => {
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
  const [featuredDialogOpen, setFeaturedDialogOpen] = useState(false);
  const [selectedFeatured, setSelectedFeatured] = useState<string[]>([]);
  const [savingFeatured, setSavingFeatured] = useState(false);

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
      fetchFeaturedAides();
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
        .eq("content_type", "aide");

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
      toast.error("Erreur lors du chargement des aides");
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedAides = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "featured_aides")
        .maybeSingle();

      if (data?.value) {
        const aideIds = (data.value as any).aide_ids || [];
        setSelectedFeatured(aideIds);
      }
    } catch (error) {
      console.error("Error fetching featured aides:", error);
    }
  };

  const handleSaveFeaturedAides = async () => {
    if (selectedFeatured.length !== 3) {
      toast.error("Veuillez sélectionner exactement 3 aides");
      return;
    }

    setSavingFeatured(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({
          key: "featured_aides",
          value: { aide_ids: selectedFeatured },
          updated_by: user?.id,
        });

      if (error) throw error;

      toast.success("Aides mises en avant sauvegardées");
      setFeaturedDialogOpen(false);
    } catch (error) {
      console.error("Error saving featured aides:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSavingFeatured(false);
    }
  };

  const toggleFeaturedAide = (aideId: string) => {
    setSelectedFeatured(prev => {
      if (prev.includes(aideId)) {
        return prev.filter(id => id !== aideId);
      }
      if (prev.length >= 3) {
        toast.error("Vous ne pouvez sélectionner que 3 aides maximum");
        return prev;
      }
      return [...prev, aideId];
    });
  };

  const handleDelete = async () => {
    if (!postToDelete) return;

    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postToDelete);

      if (error) throw error;

      toast.success("Aide supprimée avec succès");
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
          ? "Aide publiée avec succès" 
          : "Aide désactivée avec succès"
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
        <title>Gérer les aides & subventions | Prime Énergies</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Gérer les aides & subventions</h1>
              <div className="flex gap-3">
                <Button
                  onClick={() => setFeaturedDialogOpen(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Star className="w-4 h-4" />
                  Aides en avant ({selectedFeatured.length}/3)
                </Button>
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
                <Link to="/creer-contenu?type=aide">
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Créer une aide
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
                <p className="text-muted-foreground">Aucune aide trouvée</p>
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
                                <Link to={`/creer-contenu?type=aide&edit=${post.id}`}>
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
              Êtes-vous sûr de vouloir supprimer cette aide ? Cette action est irréversible.
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

      <Dialog open={featuredDialogOpen} onOpenChange={setFeaturedDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sélectionner les aides à mettre en avant</DialogTitle>
            <DialogDescription>
              Choisissez exactement 3 aides qui seront affichées sur la page d'accueil
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            {posts
              .filter(post => post.status === "published")
              .map(post => (
                <div
                  key={post.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedFeatured.includes(post.id)
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => toggleFeaturedAide(post.id)}
                >
                  <div className="flex-shrink-0">
                    {selectedFeatured.includes(post.id) ? (
                      <Star className="w-5 h-5 text-primary fill-primary" />
                    ) : (
                      <Star className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{post.title}</p>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground truncate">{post.excerpt}</p>
                    )}
                  </div>
                  {selectedFeatured.includes(post.id) && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      #{selectedFeatured.indexOf(post.id) + 1}
                    </span>
                  )}
                </div>
              ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFeaturedDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSaveFeaturedAides}
              disabled={selectedFeatured.length !== 3 || savingFeatured}
            >
              {savingFeatured && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enregistrer ({selectedFeatured.length}/3)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ManageAides;
