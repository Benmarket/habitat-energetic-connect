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
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, X, Sparkles, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ArticleVariantsModal } from "@/components/ArticleVariantsModal";
import { ArticlePreviewModal } from "@/components/ArticlePreviewModal";
import { AIInstructionsModal } from "@/components/AIInstructionsModal";
import { z } from "zod";
import { RichTextEditor } from "@/components/RichTextEditor";
import { MediaLibrary } from "@/components/MediaLibrary";
import { FavoriteButtonsBar } from "@/components/FavoriteButtonsBar";

const postSchema = z.object({
  title: z.string().trim().min(5, "Le titre doit contenir au moins 5 caractères").max(200, "Le titre ne peut pas dépasser 200 caractères"),
  slug: z.string().trim().min(3, "Le slug doit contenir au moins 3 caractères").max(200, "Le slug ne peut pas dépasser 200 caractères"),
  excerpt: z.string().trim().max(500, "L'extrait ne peut pas dépasser 500 caractères").optional(),
  content: z.string().trim().min(50, "Le contenu doit contenir au moins 50 caractères"),
  featured_image: z.string().url("URL d'image invalide").optional().or(z.literal("")),
  meta_title: z.string().trim().max(60, "Le titre SEO ne peut pas dépasser 60 caractères").optional(),
  meta_description: z.string().trim().max(160, "La description SEO ne peut pas dépasser 160 caractères").optional(),
  focus_keywords: z.array(z.string()).optional(),
  tldr: z.string().trim().max(500, "Le résumé TL;DR ne peut pas dépasser 500 caractères").optional(),
  faq: z.array(z.object({
    question: z.string().trim().min(5, "La question doit contenir au moins 5 caractères"),
    answer: z.string().trim().min(10, "La réponse doit contenir au moins 10 caractères")
  })).optional(),
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
  const editId = searchParams.get("edit"); // ID de l'article à éditer
  
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
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
    focus_keywords: [] as string[],
    tldr: "",
    faq: [] as Array<{ question: string; answer: string }>,
    status: "draft",
    category_id: "",
    tag_ids: [] as string[],
  });
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const [variantsModalOpen, setVariantsModalOpen] = useState(false);
  const [generatedVariants, setGeneratedVariants] = useState<any>(null);
  const [generatingArticle, setGeneratingArticle] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [regeneratingVariantId, setRegeneratingVariantId] = useState<number | null>(null);
  const [previousVariantVersions, setPreviousVariantVersions] = useState<Map<number, any>>(new Map());
  const [aiInstructionsModalOpen, setAiInstructionsModalOpen] = useState(false);
  const [defaultAiInstructions, setDefaultAiInstructions] = useState("");
  const [currentAiInstructions, setCurrentAiInstructions] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/connexion");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchCategories();
    fetchTags();
    loadAiInstructions();
  }, [contentType]);

  // Charger l'article à éditer
  useEffect(() => {
    if (editId && user) {
      loadPostForEdit(editId);
    }
  }, [editId, user]);

  const loadPostForEdit = async (postId: string) => {
    setLoadingPost(true);
    try {
      // Charger l'article
      const { data: post, error: postError } = await supabase
        .from("posts")
        .select(`
          *,
          post_categories(category_id),
          post_tags(tag_id)
        `)
        .eq("id", postId)
        .single();

      if (postError) throw postError;

      if (post) {
        // Remplir le formulaire avec les données de l'article
        setFormData({
          title: post.title || "",
          slug: post.slug || "",
          excerpt: post.excerpt || "",
          content: post.content || "",
          featured_image: post.featured_image || "",
          meta_title: post.meta_title || "",
          meta_description: post.meta_description || "",
          focus_keywords: post.focus_keywords || [],
          tldr: post.tldr || "",
          faq: (Array.isArray(post.faq) ? post.faq : []) as Array<{ question: string; answer: string }>,
          status: post.status || "draft",
          category_id: post.post_categories?.[0]?.category_id || "",
          tag_ids: post.post_tags?.map((pt: any) => pt.tag_id) || [],
        });
      }
    } catch (error: any) {
      console.error("Error loading post:", error);
      toast.error("Erreur lors du chargement de l'article");
    } finally {
      setLoadingPost(false);
    }
  };

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

  const loadAiInstructions = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "ai_custom_instructions")
        .single();

      if (!error && data) {
        const instructions = data.value as string || "";
        setDefaultAiInstructions(instructions);
        setCurrentAiInstructions(instructions);
      }
    } catch (error) {
      console.error("Error loading AI instructions:", error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleGenerateArticle = async () => {
    if (formData.focus_keywords.length === 0) {
      toast.error("Veuillez ajouter au moins un mot-clé avant de générer un article");
      return;
    }

    setGeneratingArticle(true);
    setVariantsModalOpen(true);

    try {
      // 1. Générer les articles avec l'IA
      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: {
          keywords: formData.focus_keywords,
          contentType: contentType,
          customInstructions: currentAiInstructions
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Erreur lors de la génération");
      }

      // 2. Pour chaque variante, générer les images immédiatement
      const variantsWithImages = await Promise.all(
        data.variants.map(async (variant: any) => {
          // Extraire les descriptions d'images du contenu
          const imageMatches = variant.content?.match(/\[IMAGE:\s*([^\]]+)\]/g) || [];
          const imageDescriptions = imageMatches.map((match: string) => 
            match.replace(/\[IMAGE:\s*/, '').replace(/\]/, '').trim()
          );

          let contentWithImages = variant.content || '';
          let featuredImageUrl = '';

          // Générer les images si nécessaire
          if (imageDescriptions.length > 0 && user) {
            try {
              const { data: imagesData, error: imagesError } = await supabase.functions.invoke('generate-images', {
                body: {
                  imageDescriptions: imageDescriptions,
                  userId: user.id
                }
              });

              if (imagesError) {
                console.error('Error generating images for variant:', imagesError);
              } else if (imagesData?.success && imagesData.images) {
                // Utiliser la première image comme image à la une
                const firstSuccessImage = imagesData.images.find((img: any) => img.success);
                if (firstSuccessImage) {
                  featuredImageUrl = firstSuccessImage.url;
                }

                // Remplacer les placeholders d'images dans le contenu
                imagesData.images.forEach((imgData: any, index: number) => {
                  if (imgData.success && imageMatches[index]) {
                    const imgTag = `<img src="${imgData.url}" alt="${imgData.description}" class="rounded-lg max-w-full h-auto my-4" />`;
                    contentWithImages = contentWithImages.replace(imageMatches[index], imgTag);
                  }
                });
              }
            } catch (imgError) {
              console.error('Error in image generation for variant:', imgError);
            }
          }

          return {
            ...variant,
            content: contentWithImages,
            featuredImageUrl: featuredImageUrl
          };
        })
      );

      setGeneratedVariants(variantsWithImages);
      toast.success("Articles générés avec images !");
    } catch (error: any) {
      console.error("Error generating article:", error);
      toast.error(error.message || "Erreur lors de la génération de l'article");
      setVariantsModalOpen(false);
    } finally {
      setGeneratingArticle(false);
    }
  };

  const handleSelectVariant = async (variant: any) => {
    // Les images ont déjà été générées dans handleGenerateArticle
    // Il suffit maintenant de remplir tous les champs du formulaire
    setFormData(prev => ({
      ...prev,
      title: variant.title || '',
      slug: generateSlug(variant.title || ''),
      content: variant.content || '',
      excerpt: variant.excerpt || '',
      featured_image: variant.featuredImageUrl || '',
      meta_title: variant.metaTitle || variant.title?.slice(0, 60) || '',
      meta_description: variant.metaDescription || variant.excerpt?.slice(0, 160) || '',
      focus_keywords: variant.focusKeywords || prev.focus_keywords,
      tldr: variant.tldr || '',
      faq: variant.faq || []
    }));

    toast.success("Article sélectionné ! Tous les champs ont été remplis.");
  };

  const handleRegenerateVariant = async (variantId: number, instructions: string) => {
    setRegeneratingVariantId(variantId);
    
    try {
      const currentVariant = generatedVariants?.find((v: any) => v.id === variantId);
      if (!currentVariant) {
        toast.error("Variante introuvable");
        setRegeneratingVariantId(null);
        return;
      }

      console.log('Regenerating variant:', {
        variantId,
        hasKeywords: formData.focus_keywords.length > 0,
        instructions: instructions.substring(0, 100)
      });

      // Sauvegarder la version actuelle avant régénération
      if (!previousVariantVersions.has(variantId)) {
        setPreviousVariantVersions(prev => new Map(prev).set(variantId, { ...currentVariant }));
      }

      // Appel à l'edge function pour régénérer avec instructions
      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: { 
          keywords: formData.focus_keywords.length > 0 ? formData.focus_keywords : ['panneau solaire'],
          contentType: contentType,
          baseContent: currentVariant.content,
          additionalInstructions: instructions
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || "Erreur lors de l'appel à l'edge function");
      }

      if (!data) {
        throw new Error("Aucune donnée reçue de l'edge function");
      }

      if (!data.success) {
        throw new Error(data.error || "La génération a échoué");
      }

      if (!data.variants || data.variants.length === 0) {
        throw new Error("Aucune variante générée");
      }

      // Récupérer la première variante régénérée
      const regeneratedVariant = data.variants[0];
      console.log('Regenerated variant received:', {
        hasTitle: !!regeneratedVariant.title,
        hasContent: !!regeneratedVariant.content,
        contentLength: regeneratedVariant.content?.length
      });
      
      // Générer l'image pour la variante régénérée
      const imageDescription = regeneratedVariant.imageDescription || 
        `Image pour l'article: ${regeneratedVariant.title}`;
      
      console.log('Generating image for regenerated variant...');
      const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-images', {
        body: { 
          descriptions: [imageDescription]
        }
      });

      if (imageError) {
        console.error('Image generation error:', imageError);
      } else if (imageData?.images?.[0]) {
        regeneratedVariant.featuredImageUrl = imageData.images[0];
        console.log('Image generated successfully');
      }

      // Remplacer la variante dans le tableau
      setGeneratedVariants((prev: any) => 
        prev.map((v: any) => v.id === variantId ? {
          ...regeneratedVariant,
          id: variantId
        } : v)
      );

      toast.success("Variante régénérée avec succès !");
    } catch (error: any) {
      console.error("Error regenerating variant:", error);
      toast.error(error.message || "Erreur lors de la régénération de la variante");
    } finally {
      setRegeneratingVariantId(null);
    }
  };

  const handleRestorePreviousVersion = (variantId: number) => {
    const previousVersion = previousVariantVersions.get(variantId);
    if (previousVersion) {
      setGeneratedVariants((prev: any) => 
        prev.map((v: any) => v.id === variantId ? previousVersion : v)
      );
      
      // Supprimer la version sauvegardée
      setPreviousVariantVersions(prev => {
        const newMap = new Map(prev);
        newMap.delete(variantId);
        return newMap;
      });
      
      toast.success("Version précédente restaurée");
    }
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
        focus_keywords: formData.focus_keywords,
        tldr: formData.tldr,
        faq: formData.faq,
      });

      if (!formData.category_id) {
        toast.error("Veuillez sélectionner une catégorie");
        setLoading(false);
        return;
      }

      if (formData.tag_ids.length === 0) {
        toast.error("Veuillez sélectionner au moins une étiquette");
        setLoading(false);
        return;
      }

      // Préparer les données du post
      const postData: any = {
        title: validatedData.title,
        slug: validatedData.slug,
        content: validatedData.content,
        content_type: contentType as "actualite" | "guide" | "aide" | "annonce",
        status,
      };

      if (validatedData.excerpt) postData.excerpt = validatedData.excerpt;
      if (validatedData.featured_image) postData.featured_image = validatedData.featured_image;
      if (validatedData.meta_title) postData.meta_title = validatedData.meta_title;
      if (validatedData.meta_description) postData.meta_description = validatedData.meta_description;
      if (validatedData.focus_keywords && validatedData.focus_keywords.length > 0) {
        postData.focus_keywords = validatedData.focus_keywords;
      }
      if (validatedData.tldr) postData.tldr = validatedData.tldr;
      if (validatedData.faq && validatedData.faq.length > 0) {
        postData.faq = validatedData.faq;
      }
      if (status === "published" && !editId) postData.published_at = new Date().toISOString();

      let postId = editId;

      if (editId) {
        // Mise à jour d'un article existant
        const { error: updateError } = await supabase
          .from("posts")
          .update(postData)
          .eq("id", editId);

        if (updateError) throw updateError;

        // Supprimer les anciennes catégories et tags
        await supabase.from("post_categories").delete().eq("post_id", editId);
        await supabase.from("post_tags").delete().eq("post_id", editId);
      } else {
        // Création d'un nouvel article
        postData.author_id = user!.id;
        
        const { data: post, error: postError } = await supabase
          .from("posts")
          .insert(postData)
          .select()
          .single();

        if (postError) throw postError;
        postId = post.id;
      }

      // Ajouter la catégorie
      const { error: categoryError } = await supabase
        .from("post_categories")
        .insert({
          post_id: postId,
          category_id: formData.category_id,
        });

      if (categoryError) throw categoryError;

      // Ajouter les tags
      if (formData.tag_ids.length > 0) {
        const tagInserts = formData.tag_ids.map(tag_id => ({
          post_id: postId,
          tag_id,
        }));

        const { error: tagsError } = await supabase
          .from("post_tags")
          .insert(tagInserts);

        if (tagsError) throw tagsError;
      }

      toast.success(
        editId 
          ? "Article mis à jour avec succès"
          : status === "published"
          ? "Article publié avec succès"
          : "Brouillon enregistré avec succès"
      );
      navigate("/gerer-actualites");
    } catch (error: any) {
      console.error("Error saving post:", error);
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      } else {
        toast.error("Erreur lors de la sauvegarde de l'article");
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user || loadingPost) {
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
    annonce: "Annonce",
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {editId ? "Éditer" : "Créer"} un {contentTypeLabels[contentType as keyof typeof contentTypeLabels]}
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewModalOpen(true)}
                  disabled={!formData.title || !formData.content}
                  className="gap-2"
                >
                  Prévisualisation live
                </Button>
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
                    <Label>Étiquettes * (sélectionnez au moins une)</Label>
                    <div className="border rounded-md p-4 space-y-3 max-h-48 overflow-y-auto bg-background">
                      {tags.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucune étiquette disponible</p>
                      ) : (
                        tags.map((tag) => (
                          <div key={tag.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`tag-${tag.id}`}
                              checked={formData.tag_ids.includes(tag.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({
                                    ...formData,
                                    tag_ids: [...formData.tag_ids, tag.id],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    tag_ids: formData.tag_ids.filter((id) => id !== tag.id),
                                  });
                                }
                              }}
                            />
                            <Label
                              htmlFor={`tag-${tag.id}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {tag.name}
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
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
                    <Label htmlFor="tldr">En résumé (TL;DR) - Optimisation GEO</Label>
                    <Textarea
                      id="tldr"
                      value={formData.tldr}
                      onChange={(e) => setFormData({ ...formData, tldr: e.target.value })}
                      placeholder="Résumé court en 3-4 points clés - améliore le référencement IA (ChatGPT, Gemini)"
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ce résumé sera affiché au début de l'article. Il aide les IA (ChatGPT, Gemini) à mieux comprendre votre contenu.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Questions FAQ (Facultatif) - Optimisation SEO & GEO</Label>
                    <div className="space-y-4 border rounded-md p-4 bg-muted/30">
                      {formData.faq.map((item, index) => (
                        <div key={index} className="space-y-2 p-3 border rounded-md bg-background">
                          <div className="flex justify-between items-center">
                            <Label className="text-sm font-semibold">Question {index + 1}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  faq: formData.faq.filter((_, i) => i !== index)
                                });
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          <Input
                            placeholder="Question"
                            value={item.question}
                            onChange={(e) => {
                              const newFaq = [...formData.faq];
                              newFaq[index].question = e.target.value;
                              setFormData({ ...formData, faq: newFaq });
                            }}
                          />
                          <Textarea
                            placeholder="Réponse"
                            value={item.answer}
                            rows={3}
                            onChange={(e) => {
                              const newFaq = [...formData.faq];
                              newFaq[index].answer = e.target.value;
                              setFormData({ ...formData, faq: newFaq });
                            }}
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            faq: [...formData.faq, { question: '', answer: '' }]
                          });
                        }}
                        className="w-full"
                      >
                        + Ajouter une question FAQ
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Les FAQ améliorent votre SEO et aident les IA à mieux référencer votre article. 3-5 questions recommandées.
                      </p>
                    </div>
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Label htmlFor="focus_keywords">Mots-clés ciblés (SEO, IA & GEO)</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAiInstructionsModalOpen(true)}
                          className="gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Instruction article IA
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateArticle}
                          disabled={generatingArticle || formData.focus_keywords.length === 0}
                          className="gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Générer l'article
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Input
                        id="focus_keywords"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const keyword = keywordInput.trim();
                            if (keyword && !formData.focus_keywords.includes(keyword)) {
                              setFormData({
                                ...formData,
                                focus_keywords: [...formData.focus_keywords, keyword],
                              });
                              setKeywordInput("");
                            }
                          }
                        }}
                        placeholder="Tapez un mot-clé et appuyez sur Entrée"
                      />
                      {formData.focus_keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.focus_keywords.map((keyword, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="gap-1 pr-1"
                            >
                              {keyword}
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    focus_keywords: formData.focus_keywords.filter((_, i) => i !== index),
                                  });
                                }}
                                className="ml-1 hover:bg-muted rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ces mots-clés aident votre article à mieux ranker sur Google, Bing et les IA comme ChatGPT. Appuyez sur Entrée pour ajouter chaque mot-clé.
                    </p>
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

        <ArticleVariantsModal
          open={variantsModalOpen}
          onOpenChange={setVariantsModalOpen}
          variants={generatedVariants}
          loading={generatingArticle}
          onSelectVariant={handleSelectVariant}
          onRegenerateVariant={handleRegenerateVariant}
          regeneratingVariantId={regeneratingVariantId}
          previousVersions={previousVariantVersions}
          onRestorePreviousVersion={handleRestorePreviousVersion}
        />

        <ArticlePreviewModal
          open={previewModalOpen}
          onOpenChange={setPreviewModalOpen}
          title={formData.title}
          content={formData.content}
          featuredImage={formData.featured_image}
          excerpt={formData.excerpt}
          focusKeywords={formData.focus_keywords}
          metaTitle={formData.meta_title}
          metaDescription={formData.meta_description}
        />

        <AIInstructionsModal
          open={aiInstructionsModalOpen}
          onOpenChange={setAiInstructionsModalOpen}
          defaultInstructions={defaultAiInstructions}
          currentInstructions={currentAiInstructions}
          onSave={(instructions) => setCurrentAiInstructions(instructions)}
        />
      </div>
    </>
  );
};

export default CreatePost;
