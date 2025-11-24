import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { RichTextEditor } from "@/components/RichTextEditor";
import { MediaLibrary } from "@/components/MediaLibrary";

const postSchema = z.object({
  title: z.string().trim().min(5, "Le titre doit contenir au moins 5 caractères").max(200, "Le titre ne peut pas dépasser 200 caractères"),
  slug: z.string().trim().min(3, "Le slug doit contenir au moins 3 caractères").max(200, "Le slug ne peut pas dépasser 200 caractères"),
  excerpt: z.string().trim().max(500, "L'extrait ne peut pas dépasser 500 caractères").optional(),
  content: z.string().trim().min(50, "Le contenu doit contenir au moins 50 caractères"),
  featured_image: z.string().url("URL d'image invalide").optional().or(z.literal("")),
  meta_title: z.string().trim().max(60, "Le titre SEO ne peut pas dépasser 60 caractères").optional(),
  meta_description: z.string().trim().max(160, "La description SEO ne peut pas dépasser 160 caractères").optional(),
});

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

const CreatePost = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contentType = searchParams.get("type") || "actualite";
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featured_image: "",
    meta_title: "",
    meta_description: "",
    status: "draft",
    category_id: "",
    tag_ids: [] as string[],
  });
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/connexion");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchCategories();
    fetchTags();
  }, [contentType]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("content_type", contentType as "actualite" | "guide" | "aide")
      .order("name");
    
    if (data) setCategories(data);
  };

  const fetchTags = async () => {
    const { data } = await supabase
      .from("tags")
      .select("*")
      .eq("content_type", contentType as "actualite" | "guide" | "aide")
      .order("name");
    
    if (data) setTags(data);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent, status: "draft" | "published") => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      const validatedData = postSchema.parse({
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        featured_image: formData.featured_image,
        meta_title: formData.meta_title,
        meta_description: formData.meta_description,
      });

      if (!formData.category_id) {
        toast.error("Veuillez sélectionner une catégorie");
        setLoading(false);
        return;
      }

      // Create post
      const postData: any = {
        title: validatedData.title,
        slug: validatedData.slug,
        content: validatedData.content,
        author_id: user!.id,
        content_type: contentType as "actualite" | "guide" | "aide",
        status,
      };

      if (validatedData.excerpt) postData.excerpt = validatedData.excerpt;
      if (validatedData.featured_image) postData.featured_image = validatedData.featured_image;
      if (validatedData.meta_title) postData.meta_title = validatedData.meta_title;
      if (validatedData.meta_description) postData.meta_description = validatedData.meta_description;
      if (status === "published") postData.published_at = new Date().toISOString();

      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert(postData)
        .select()
        .single();

      if (postError) throw postError;

      // Add category
      const { error: categoryError } = await supabase
        .from("post_categories")
        .insert({
          post_id: post.id,
          category_id: formData.category_id,
        });

      if (categoryError) throw categoryError;

      // Add tags
      if (formData.tag_ids.length > 0) {
        const tagInserts = formData.tag_ids.map(tag_id => ({
          post_id: post.id,
          tag_id,
        }));

        const { error: tagsError } = await supabase
          .from("post_tags")
          .insert(tagInserts);

        if (tagsError) throw tagsError;
      }

      toast.success(
        status === "published"
          ? "Article publié avec succès"
          : "Brouillon enregistré avec succès"
      );
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating post:", error);
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      } else {
        toast.error("Erreur lors de la création de l'article");
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
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
        <title>Créer un {contentTypeLabels[contentType as keyof typeof contentTypeLabels]} | Prime Énergies</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="mb-6 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au tableau de bord
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>
                  Créer un {contentTypeLabels[contentType as keyof typeof contentTypeLabels]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Titre de l'article"
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="slug-de-larticle"
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="featured_image">Image à la une</Label>
                    <div className="flex gap-2">
                      <Input
                        id="featured_image"
                        value={formData.featured_image}
                        onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                        placeholder="URL de l'image ou sélectionnez depuis la bibliothèque"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setMediaLibraryOpen(true)}
                      >
                        Bibliothèque
                      </Button>
                    </div>
                    {formData.featured_image && (
                      <img 
                        src={formData.featured_image} 
                        alt="Aperçu" 
                        className="w-full h-48 object-cover rounded-md mt-2"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Extrait</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Court résumé de l'article"
                      rows={3}
                      maxLength={500}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Contenu *</Label>
                    <RichTextEditor
                      content={formData.content}
                      onChange={(content) => setFormData({ ...formData, content })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Utilisez la barre d'outils pour formater votre texte, ajouter des images et des boutons personnalisés
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_title">Titre SEO (max 60 caractères)</Label>
                    <Input
                      id="meta_title"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      placeholder="Titre pour les moteurs de recherche"
                      maxLength={60}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Description SEO (max 160 caractères)</Label>
                    <Textarea
                      id="meta_description"
                      value={formData.meta_description}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      placeholder="Description pour les moteurs de recherche"
                      rows={2}
                      maxLength={160}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => handleSubmit(e, "draft")}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer brouillon"}
                    </Button>
                    <Button
                      type="button"
                      onClick={(e) => handleSubmit(e, "published")}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publier"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
        
        <MediaLibrary 
          open={mediaLibraryOpen}
          onOpenChange={setMediaLibraryOpen}
          onSelect={(url, alt) => {
            setFormData({ ...formData, featured_image: url });
            setMediaLibraryOpen(false);
          }}
        />
      </div>
    </>
  );
};

export default CreatePost;
