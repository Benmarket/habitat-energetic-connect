import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Plus, Pencil, Trash2, User, Search } from "lucide-react";
import { MediaLibrary } from "@/components/MediaLibrary";

interface Author {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  job_title: string | null;
  created_at: string;
}

const AdminAuthors = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formJobTitle, setFormJobTitle] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formAvatar, setFormAvatar] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/connexion");
  }, [user, authLoading, navigate]);

  const fetchAuthors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("authors")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erreur lors du chargement des auteurs");
    } else {
      setAuthors(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchAuthors();
  }, [user]);

  const openCreate = () => {
    setEditingAuthor(null);
    setFormName("");
    setFormJobTitle("");
    setFormBio("");
    setFormAvatar("");
    setModalOpen(true);
  };

  const openEdit = (author: Author) => {
    setEditingAuthor(author);
    setFormName(author.name);
    setFormJobTitle(author.job_title || "");
    setFormBio(author.bio || "");
    setFormAvatar(author.avatar_url || "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    setSaving(true);
    try {
      if (editingAuthor) {
        const { error } = await supabase
          .from("authors")
          .update({
            name: formName.trim(),
            job_title: formJobTitle.trim() || null,
            bio: formBio.trim() || null,
            avatar_url: formAvatar.trim() || null,
          })
          .eq("id", editingAuthor.id);
        if (error) throw error;
        toast.success("Auteur mis à jour");
      } else {
        const { error } = await supabase.from("authors").insert({
          name: formName.trim(),
          job_title: formJobTitle.trim() || null,
          bio: formBio.trim() || null,
          avatar_url: formAvatar.trim() || null,
          created_by: user?.id,
        });
        if (error) throw error;
        toast.success("Auteur créé");
      }
      setModalOpen(false);
      fetchAuthors();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (author: Author) => {
    if (!confirm(`Supprimer l'auteur "${author.name}" ?`)) return;
    const { error } = await supabase.from("authors").delete().eq("id", author.id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Auteur supprimé");
      fetchAuthors();
    }
  };

  const filtered = authors.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.job_title || "").toLowerCase().includes(search.toLowerCase())
  );

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
        <title>Gestion des Auteurs | Administration</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8 max-w-5xl">
            <Link
              to="/administration"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l'administration
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Auteurs</h1>
                <p className="text-muted-foreground mt-1">
                  {authors.length} auteur{authors.length !== 1 ? "s" : ""} enregistré{authors.length !== 1 ? "s" : ""}
                </p>
              </div>
              <Button onClick={openCreate} className="gap-2">
                <Plus className="w-4 h-4" />
                Nouvel auteur
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un auteur..."
                className="pl-10"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {search ? "Aucun auteur trouvé" : "Aucun auteur créé. Commencez par en ajouter un !"}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((author) => (
                  <Card key={author.id} className="group hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {author.avatar_url ? (
                          <img
                            src={author.avatar_url}
                            alt={author.name}
                            className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-7 h-7 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground truncate">{author.name}</h3>
                          {author.job_title && (
                            <p className="text-sm text-primary/80 font-medium truncate">{author.job_title}</p>
                          )}
                          {author.bio && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{author.bio}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(author)}
                          className="flex-1 gap-1.5"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Modifier
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(author)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAuthor ? "Modifier l'auteur" : "Nouvel auteur"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Fabien Lemarchand"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Poste / Titre</Label>
              <Input
                value={formJobTitle}
                onChange={(e) => setFormJobTitle(e.target.value)}
                placeholder="Ex: Rédacteur énergies renouvelables"
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label>Bio / Expertise</Label>
              <Textarea
                value={formBio}
                onChange={(e) => setFormBio(e.target.value)}
                placeholder="Expert en énergies renouvelables..."
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="space-y-2">
              <Label>Photo de profil</Label>
              <div className="flex gap-2">
                <Input
                  value={formAvatar}
                  onChange={(e) => setFormAvatar(e.target.value)}
                  placeholder="URL de la photo"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMediaLibraryOpen(true)}
                >
                  Choisir
                </Button>
              </div>
              {/* Live preview */}
              {(formAvatar || formName) && (
                <div className="flex items-center gap-3 mt-3 p-3 rounded-lg bg-muted/50 border">
                  {formAvatar ? (
                    <img
                      src={formAvatar}
                      alt="Aperçu"
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/20"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {formName || "Nom de l'auteur"}
                    </p>
                    {formJobTitle && (
                      <p className="text-xs text-muted-foreground truncate">{formJobTitle}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingAuthor ? "Enregistrer" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <MediaLibrary
        open={mediaLibraryOpen}
        onOpenChange={setMediaLibraryOpen}
        onSelect={(url) => {
          setFormAvatar(url);
          setMediaLibraryOpen(false);
        }}
      />
    </>
  );
};

export default AdminAuthors;
