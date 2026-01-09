import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, MessageSquare } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ForumImageUpload from "@/components/forum/ForumImageUpload";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

const NewTopic = () => {
  const { slug } = useParams(); // Category slug (optional)
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour créer un sujet.",
        variant: "destructive",
      });
      navigate("/connexion");
      return;
    }

    fetchCategories();
  }, [user, navigate]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("forum_categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (data) {
      setCategories(data);

      // If slug provided, pre-select category
      if (slug) {
        const category = data.find((cat) => cat.slug === slug);
        if (category) {
          setSelectedCategoryId(category.id);
        }
      }
    }
  };

  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategoryId) {
      toast({
        title: "Catégorie manquante",
        description: "Veuillez sélectionner une catégorie.",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast({
        title: "Champs obligatoires",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const topicSlug = generateSlug(title);

      // Check if slug already exists
      const { data: existingTopic } = await supabase
        .from("forum_topics")
        .select("id")
        .eq("slug", topicSlug)
        .maybeSingle();

      let finalSlug = topicSlug;
      if (existingTopic) {
        finalSlug = `${topicSlug}-${Date.now()}`;
      }

      // Create topic
      const { data: newTopic, error: topicError } = await supabase
        .from("forum_topics")
        .insert({
          category_id: selectedCategoryId,
          title: title.trim(),
          slug: finalSlug,
          author_id: user!.id,
        })
        .select()
        .single();

      if (topicError) throw topicError;

      // Build content with images
      let finalContent = content.trim();
      if (images.length > 0) {
        finalContent += "\n\n" + images.map(img => `![Image](${img})`).join("\n");
      }

      // Create first post
      const { data: newPost, error: postError } = await supabase.from("forum_posts").insert({
        topic_id: newTopic.id,
        author_id: user!.id,
        content: finalContent,
      }).select().single();

      if (postError) throw postError;

      // Link images to the post
      if (images.length > 0 && newPost) {
        await supabase
          .from("forum_images")
          .update({ post_id: newPost.id, topic_id: newTopic.id })
          .in("storage_path", images.map(url => {
            const parts = url.split("/forum-images/");
            return parts[1] || "";
          }).filter(Boolean));
      }

      toast({
        title: "Sujet créé",
        description: "Votre sujet a été publié avec succès.",
      });

      navigate(`/forum/sujet/${finalSlug}`);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de créer le sujet.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Nouveau sujet | Forums Prime Énergies</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20">
          <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="mb-8 animate-fade-in">
              <Link to={slug ? `/forum/categorie/${slug}` : "/forum"}>
                <Button variant="ghost" className="mb-4 -ml-4">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>

              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Créer un nouveau sujet
              </h1>
              <p className="text-lg text-muted-foreground">
                Posez une question ou lancez une discussion avec la communauté
              </p>
            </div>

            <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-primary" />
                  Détails du sujet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="category">Catégorie *</Label>
                    <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <span
                              className="inline-block w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: category.color || "#10b981" }}
                            />
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="title">Titre du sujet *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Un titre clair et descriptif..."
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {title.length}/200 caractères
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="content">Votre message *</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Décrivez votre question ou sujet de discussion..."
                      rows={12}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Soyez précis et détaillé pour obtenir de meilleures réponses
                    </p>
                  </div>

                  {/* Image upload */}
                  <div>
                    <Label>Images (optionnel)</Label>
                    <div className="mt-2">
                      <ForumImageUpload
                        userId={user?.id || ""}
                        images={images}
                        onImageUploaded={(url) => setImages([...images, url])}
                        onRemoveImage={(url) => setImages(images.filter(i => i !== url))}
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={submitting || !title.trim() || !content.trim() || !selectedCategoryId}
                      className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all"
                    >
                      {submitting ? "Publication..." : "Publier le sujet"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(slug ? `/forum/categorie/${slug}` : "/forum")}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default NewTopic;
