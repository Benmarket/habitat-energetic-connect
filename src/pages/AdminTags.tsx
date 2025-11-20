import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Tag {
  id: string;
  name: string;
  slug: string;
  content_type: "actualite" | "guide" | "aide";
  created_at: string;
}

const AdminTags = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    content_type: "actualite" as "actualite" | "guide" | "aide",
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/connexion");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchTags();
    }
  }, [user]);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("content_type", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      if (data) setTags(data);
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les étiquettes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("tags")
          .update({
            name: formData.name,
            slug: formData.slug,
            content_type: formData.content_type,
          })
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Étiquette mise à jour",
        });
      } else {
        const { error } = await supabase
          .from("tags")
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Étiquette créée",
        });
      }

      setFormData({ name: "", slug: "", content_type: "actualite" });
      setEditingId(null);
      fetchTags();
    } catch (error: any) {
      console.error("Error saving tag:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder l'étiquette",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (tag: Tag) => {
    setFormData({
      name: tag.name,
      slug: tag.slug,
      content_type: tag.content_type,
    });
    setEditingId(tag.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette étiquette ?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Étiquette supprimée",
      });
      fetchTags();
    } catch (error: any) {
      console.error("Error deleting tag:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'étiquette",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setFormData({ name: "", slug: "", content_type: "actualite" });
    setEditingId(null);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      actualite: "Actualité",
      guide: "Guide",
      aide: "Aide",
    };
    return labels[type] || type;
  };

  return (
    <>
      <Helmet>
        <title>Gérer les étiquettes | Administration</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <Link 
              to="/administration"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'administration
            </Link>

            <h1 className="text-3xl font-bold mb-8">Gérer les étiquettes</h1>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Formulaire */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingId ? "Modifier l'étiquette" : "Nouvelle étiquette"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nom</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Innovation"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="slug">Slug (URL)</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="innovation"
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
                          <SelectItem value="aide">Aide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        <Plus className="w-4 h-4 mr-2" />
                        {editingId ? "Mettre à jour" : "Créer"}
                      </Button>
                      {editingId && (
                        <Button type="button" variant="outline" onClick={cancelEdit}>
                          Annuler
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Liste des étiquettes */}
              <Card>
                <CardHeader>
                  <CardTitle>Étiquettes existantes</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : tags.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Aucune étiquette pour le moment
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {tags.map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{tag.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {getContentTypeLabel(tag.content_type)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">/{tag.slug}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(tag)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(tag.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default AdminTags;
