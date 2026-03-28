// useArticleGeneration v5 - Multi-step: angles → selection → single article
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseContentToSections, CreatePostFormData, generateSlug } from "./useCreatePost";
import { GenerationInput, EditorialAngle } from "@/components/ArticleGenerationWizard";

interface ArticleGenerationOptions {
  categories?: Array<{ id: string; name: string; slug: string }>;
  tags?: Array<{ id: string; name: string; slug: string }>;
}

export function useArticleGeneration(
  formData: CreatePostFormData,
  setFormData: React.Dispatch<React.SetStateAction<CreatePostFormData>>,
  contentType: string,
  currentAiInstructions: string,
  userId?: string,
  options?: ArticleGenerationOptions
) {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [loadingAngles, setLoadingAngles] = useState(false);
  const [angles, setAngles] = useState<EditorialAngle[] | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<any | null>(null);

  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) {
      toast.error("Vous devez être connecté pour générer un article");
      return null;
    }
    return token;
  };

  // STEP 1→2: Generate 5 editorial angles
  const handleGenerateAngles = async (input: GenerationInput) => {
    setLoadingAngles(true);
    setAngles(null);
    setGeneratedArticle(null);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) { setLoadingAngles(false); return; }

      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: {
          mode: 'angles',
          product: input.product,
          theme: input.theme,
          objective: input.objective,
          keywords: input.keywords,
          freePrompt: input.freePrompt,
          contentType,
          customInstructions: currentAiInstructions,
        },
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erreur lors de la génération des angles");

      setAngles(data.angles);
      toast.success("5 angles éditoriaux proposés !");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la proposition des angles");
    } finally {
      setLoadingAngles(false);
    }
  };

  // STEP 3→4: Generate single article from selected angle
  const handleSelectAngle = async (angle: EditorialAngle, input: GenerationInput) => {
    setLoadingArticle(true);
    setGeneratedArticle(null);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) { setLoadingArticle(false); return; }

      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: {
          mode: 'article',
          product: input.product,
          theme: input.theme,
          objective: input.objective,
          keywords: input.keywords,
          freePrompt: input.freePrompt,
          contentType,
          customInstructions: currentAiInstructions,
          guideTemplate: contentType === 'guide' ? formData.guide_template : undefined,
          userId,
          selectedAngle: {
            type: angle.type,
            title: angle.title,
            intention: angle.intention,
          },
        },
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erreur lors de la génération");

      const article = data.article;

      // Generate images from placeholders
      let contentWithImages = article.content || '';
      let featuredImageUrl = '';
      const imageMatches = contentWithImages.match(/\[IMAGE:\s*([^\]]+)\]/g) || [];
      const imageDescriptions = imageMatches.map((m: string) => m.replace(/\[IMAGE:\s*/, '').replace(/\]/, '').trim());

      if (imageDescriptions.length > 0 && userId) {
        try {
          const { data: imagesData, error: imagesError } = await supabase.functions.invoke('generate-images', {
            body: { imageDescriptions },
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!imagesError && imagesData?.success && imagesData.images) {
            const firstOk = imagesData.images.find((img: any) => img.success);
            if (firstOk) featuredImageUrl = firstOk.url;

            imagesData.images.forEach((imgData: any, index: number) => {
              if (imgData.success && imageMatches[index]) {
                const imgTag = `<img src="${imgData.url}" alt="${imgData.description}" class="rounded-lg max-w-full h-auto my-4" />`;
                contentWithImages = contentWithImages.replace(imageMatches[index], imgTag);
              }
            });
          }
        } catch { /* silent */ }
      }

      const finalArticle = {
        ...article,
        content: contentWithImages,
        featuredImageUrl,
      };

      setGeneratedArticle(finalArticle);
      toast.success("Article généré avec succès !");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la génération de l'article");
    } finally {
      setLoadingArticle(false);
    }
  };

  // Auto-detect best category
  const autoSelectCategory = (keywords: string[]): string => {
    if (formData.category_id) return formData.category_id;
    const cats = options?.categories || [];
    if (cats.length === 0) return '';
    const kws = keywords.map(k => k.toLowerCase());
    for (const cat of cats) {
      const n = cat.name.toLowerCase();
      const s = cat.slug.toLowerCase();
      if (kws.some(k => n.includes(k) || k.includes(n) || s.includes(k))) return cat.id;
    }
    return cats[0].id;
  };

  // Auto-select tags
  const autoSelectTags = (keywords: string[]): string[] => {
    if (formData.tag_ids.length > 0) return formData.tag_ids;
    const available = options?.tags || [];
    if (available.length === 0) return [];
    const kws = keywords.map(k => k.toLowerCase());
    const matched = available.filter(t => {
      const n = t.name.toLowerCase();
      const s = t.slug.toLowerCase();
      return kws.some(k => n.includes(k) || k.includes(n) || s.includes(k));
    }).map(t => t.id);
    return matched.length > 0 ? matched : available.slice(0, 2).map(t => t.id);
  };

  // Apply selected article to form
  const handleSelectArticle = (article: any) => {
    const kws = article.focusKeywords || formData.focus_keywords;
    let guideSections = formData.guide_sections;
    if (contentType === 'guide' && article.content) {
      const parsed = parseContentToSections(article.content);
      guideSections = parsed.length > 0 ? parsed : [{ id: `section-${Date.now()}`, title: 'Introduction', content: article.content }];
    }

    const autoCategory = autoSelectCategory(kws);
    const autoTags = autoSelectTags(kws);

    setFormData(prev => ({
      ...prev,
      title: article.title || '',
      slug: generateSlug(article.title || ''),
      content: article.content || '',
      excerpt: article.excerpt || '',
      featured_image: article.featuredImageUrl || '',
      meta_title: article.metaTitle || (article.title || '').slice(0, 60),
      meta_description: article.metaDescription || (article.excerpt || '').slice(0, 160),
      focus_keywords: kws,
      tldr: article.tldr || '',
      faq: article.faq || [],
      guide_sections: contentType === 'guide' ? guideSections : prev.guide_sections,
      category_id: autoCategory || prev.category_id,
      tag_ids: autoTags.length > 0 ? autoTags : prev.tag_ids,
    }));

    toast.success("Article appliqué ! Vérifiez et publiez.");
  };

  const openWizard = () => {
    setAngles(null);
    setGeneratedArticle(null);
    setWizardOpen(true);
  };

  return {
    wizardOpen,
    setWizardOpen,
    openWizard,
    loadingAngles,
    angles,
    loadingArticle,
    generatedArticle,
    handleGenerateAngles,
    handleSelectAngle,
    handleSelectArticle,
    // Keep generatingArticle for backward compat with SEOFields button state
    generatingArticle: loadingAngles || loadingArticle,
  };
}
