import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

type Category = {
  id: string;
  name: string;
  slug: string;
  content_type: string;
  description: string | null;
  created_at: string;
};

const AdminCategories = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    content_type: "actualite" as "actualite" | "guide" | "aide" | "annonce",
    description: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/connexion");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchRoles();
    }
  }, [user]);

  useEffect(() => {
    if (roles.length > 0) {
      const hasAccess = roles.includes("admin") || roles.includes("super_admin");
      if (!hasAccess) {
        toast.error("Accès non autorisé");
        navigate("/tableau-de-bord");
      } else {
        fetchCategories();
      }
    }
  }, [roles, navigate]);

  const fetchRoles = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    if (data) setRoles(data.map(r => r.role));
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("content_type", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      toast.error("Erreur lors du chargement des catégories");
    } else {
      setCategories(data || []);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCategory) {
      const { error } = await supabase
        .from("categories")
        .update({
          name: formData.name,
          slug: formData.slug,
          content_type: formData.content_type,
          description: formData.description || null,
        })
        .eq("id", editingCategory.id);

      if (error) {
        toast.error("Erreur lors de la modification");
      } else {
        toast.success("Catégorie modifiée avec succès");
        fetchCategories();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("categories")
        .insert([{
          name: formData.name,
          slug: formData.slug,
          content_type: formData.content_type,
          description: formData.description || null,
        }]);

      if (error) {
        toast.error("Erreur lors de la création");
      } else {
        toast.success("Catégorie créée avec succès");
        fetchCategories();
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) return;

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Catégorie supprimée avec succès");
      fetchCategories();
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      content_type: category.content_type as "actualite" | "guide" | "aide" | "annonce",
      description: category.description || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      content_type: "actualite",
      description: "",
    });
    setEditingCategory(null);
    setIsDialogOpen(false);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const contentTypeLabels = {
    actualite: "Actualité",
    guide: "Guide",
    aide: "Aide & Subvention",
  };

  return (
    <>
      <Helmet>
        <title>Gestion des catégories | Prime Énergies</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Gestion des catégories</h1>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle catégorie
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nom</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ 
                            ...formData, 
                            name: e.target.value,
                            slug: generateSlug(e.target.value)
                          });
                        }}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="content_type">Type de contenu</Label>
                      <Select
                        value={formData.content_type}
                        onValueChange={(value: "actualite" | "guide" | "aide") =>
                          setFormData({ ...formData, content_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="actualite">Actualité</SelectItem>
                          <SelectItem value="guide">Guide</SelectItem>
                          <SelectItem value="aide">Aide & Subvention</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Annuler
                      </Button>
                      <Button type="submit">
                        {editingCategory ? "Modifier" : "Créer"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Liste des catégories</CardTitle>
                <CardDescription>
                  Gérez les catégories utilisées dans les actualités, guides et aides
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                        <TableCell>
                          {contentTypeLabels[category.content_type as keyof typeof contentTypeLabels]}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {category.description || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(category)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(category.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default AdminCategories;
