// useArticleGeneration v7 - Review mode
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseContentToSections, CreatePostFormData, generateSlug } from "./useCreatePost";
import { GenerationInput, EditorialAngle } from "@/components/ArticleGenerationWizard";
import type { ArticleReview } from "@/components/ArticleReviewModal";

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
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [articleReview, setArticleReview] = useState<ArticleReview | null>(null);
  const [loadingFix, setLoadingFix] = useState(false);

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
          subject: input.subject,
          theme: input.theme,
          objective: input.objective,
          keywords: input.keywords,
          freePrompt: input.freePrompt,
          targetRegions: input.targetRegions,
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
          subject: input.subject,
          theme: input.theme,
          objective: input.objective,
          keywords: input.keywords,
          freePrompt: input.freePrompt,
          targetRegions: input.targetRegions,
          contentType,
          customInstructions: currentAiInstructions,
          guideTemplate: contentType === 'guide' ? formData.guide_template : undefined,
          userId,
          selectedAngle: {
            type: angle.type,
            title: angle.title,
            intention: angle.intention,
          },
          availableCategories: (options?.categories || []).map(c => ({ name: c.name, slug: c.slug })),
          availableTags: (options?.tags || []).map(t => ({ name: t.name, slug: t.slug })),
        },
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erreur lors de la génération");

      const article = data.article;
      const usage = data.usage || {};

      // Generate images from placeholders
      let contentWithImages = article.content || '';
      let featuredImageUrl = '';
      const imageMatches = contentWithImages.match(/\[IMAGE:[^\]]+\]/g) || [];

      if (imageMatches.length > 0) {
        for (let i = 0; i < imageMatches.length; i++) {
          const match = imageMatches[i];
          try {
            const parts = match.replace('[IMAGE:', '').replace(']', '').split('|').map((s: string) => s.trim());
            const imageType = parts[0] || 'illustration';
            const imageObjective = parts[1] || 'informer';
            const imagePrompt = parts[2] || match;
            const imageTitle = parts[3] || '';
            const imageCaption = parts[4] || '';

            const { data: imgData } = await supabase.functions.invoke('generate-images', {
              body: { imageDescriptions: [imagePrompt] },
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (imgData?.imageUrl) {
              const altText = imageTitle || imagePrompt.slice(0, 120);
              const figureHtml = `<figure><div data-custom-image="true" data-src="${imgData.imageUrl}" data-alt="${altText}" data-title="${imageTitle}" data-caption="${imageCaption}"></div>${imageCaption ? `<figcaption>${imageCaption}</figcaption>` : ''}</figure>`;
              contentWithImages = contentWithImages.replace(match, figureHtml);
              if (i === 0 && !featuredImageUrl) featuredImageUrl = imgData.imageUrl;
            }
          } catch (imgErr) {
            console.warn('Image generation failed for:', match, imgErr);
          }
        }
      }

      // Clean any remaining unresolved placeholders
      contentWithImages = contentWithImages.replace(/\[IMAGE:\s*[^\]]+\]/g, '');

      const finalArticle = {
        ...article,
        content: contentWithImages,
        featuredImageUrl,
        targetRegions: input.targetRegions,
        generationCost: usage.estimatedCost || null,
      };

      setGeneratedArticle(finalArticle);
      toast.success("Article généré avec images !");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la génération de l'article");
    } finally {
      setLoadingArticle(false);
    }
  };

  // Auto-detect best category
  const autoSelectCategory = (keywords: string[], extraContext = ''): string => {
    const cats = options?.categories || [];
    if (cats.length === 0) return '';

    const normalize = (value: string) =>
      (value || '')
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const context = normalize(`${keywords.join(" ")} ${extraContext}`);

    const findByPreferredSlugs = (preferredSlugs: string[]): string => {
      for (const preferred of preferredSlugs) {
        const wanted = normalize(preferred);
        const found = cats.find((c) => normalize(c.slug) === wanted);
        if (found) return found.id;
      }
      return '';
    };

    const semanticRules = [
      { terms: ['solaire', 'photovolt', 'panneau', 'batterie', 'autoconsommation', 'edf-oa', 'surplus'], slugs: ['solaire', 'photovoltaique', 'electricite'] },
      { terms: ['pompe-a-chaleur', 'pac', 'air-eau', 'air-air'], slugs: ['pompe-a-chaleur'] },
      { terms: ['isolation', 'combles', 'ite', 'toiture'], slugs: ['isolation'] },
      { terms: ['ventilation', 'vmc', 'double-flux'], slugs: ['ventilation'] },
      { terms: ['renovation-globale', 'renovation-energetique'], slugs: ['renovation-globale'] },
      { terms: ['economies-energie', 'economies-d-energie', 'facture', 'consommation'], slugs: ['economies-energie', 'economies-d-energie'] },
      { terms: ['electricite', 'electrique', 'reseau', 'compteur'], slugs: ['electricite'] },
      { terms: ['chauffage', 'chaudiere', 'radiateur', 'poele'], slugs: ['chauffage'] },
    ];

    for (const rule of semanticRules) {
      if (rule.terms.some((term) => context.includes(normalize(term)))) {
        const matched = findByPreferredSlugs(rule.slugs);
        if (matched) return matched;
      }
    }

    // Generic matching fallback
    for (const cat of cats) {
      const n = normalize(cat.name);
      const s = normalize(cat.slug);
      if (keywords.some((k) => {
        const kw = normalize(k);
        return n.includes(kw) || kw.includes(n) || s.includes(kw) || kw.includes(s);
      })) {
        return cat.id;
      }
    }

    // Do not force first category (often "chauffage")
    return '';
  };

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

  const handleSelectArticle = (article: any) => {
    const kws = article.focusKeywords || formData.focus_keywords;
    let guideSections = formData.guide_sections;
    if (contentType === 'guide' && article.content) {
      const parsed = parseContentToSections(article.content);
      guideSections = parsed.length > 0 ? parsed : [{ id: `section-${Date.now()}`, title: 'Introduction', content: article.content }];
    }

    // Use AI-suggested category if available, fallback to semantic matching
    let autoCategory = '';
    if (article.suggestedCategorySlug) {
      const cats = options?.categories || [];
      const normalize = (value: string) =>
        (value || '')
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      const target = normalize(article.suggestedCategorySlug);
      const found = cats.find(c => normalize(c.slug) === target);
      if (found) autoCategory = found.id;
    }
    if (!autoCategory) {
      autoCategory = autoSelectCategory(
        kws,
        `${article.title || ''} ${article.excerpt || ''} ${article.content || ''}`
      );
    }

    // Use AI-suggested tags if available, fallback to keyword matching
    let autoTags: string[] = [];
    if (article.suggestedTagSlugs?.length > 0) {
      const available = options?.tags || [];
      autoTags = article.suggestedTagSlugs
        .map((slug: string) => available.find(t => t.slug === slug)?.id)
        .filter(Boolean) as string[];
    }
    if (autoTags.length === 0) autoTags = autoSelectTags(kws);

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
      target_regions: article.targetRegions || prev.target_regions,
      generation_cost: article.generationCost ?? prev.generation_cost,
    }));

    toast.success("Article appliqué avec catégorie et étiquettes !");
  };

  const openWizard = () => {
    setAngles(null);
    setGeneratedArticle(null);
    setWizardOpen(true);
  };

  const handleStartReview = async () => {
    if (!formData.content || !formData.title) {
      toast.error("L'article doit avoir un titre et du contenu pour être relu");
      return;
    }
    setLoadingReview(true);
    setArticleReview(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) { setLoadingReview(false); return; }

      const categoryName = options?.categories?.find(c => c.id === formData.category_id)?.name || '';

      const tagNames = (options?.tags || [])
        .filter(t => (formData.tag_ids || []).includes(t.id))
        .map(t => t.name);

      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: {
          mode: 'review',
          title: formData.title,
          content: formData.content,
          contentType,
          categoryName,
          excerpt: formData.excerpt || '',
          metaTitle: formData.meta_title || '',
          metaDescription: formData.meta_description || '',
          focusKeywords: formData.focus_keywords || [],
          targetRegions: formData.target_regions || [],
          faq: formData.faq || [],
          tldr: formData.tldr || '',
          tagNames,
          featuredImage: formData.featured_image || '',
        },
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erreur lors de la relecture");

      setArticleReview(data.review);
      toast.success("Relecture terminée !");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la relecture IA");
    } finally {
      setLoadingReview(false);
    }
  };

  const openReviewModal = () => {
    setReviewModalOpen(true);
    if (!articleReview && formData.content) {
      handleStartReview();
    }
  };

  const handleApplyFixes = async () => {
    if (!articleReview || !formData.content) return;
    setLoadingFix(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) { setLoadingFix(false); return; }

      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: {
          mode: 'review_fix',
          title: formData.title,
          content: formData.content,
          contentType,
          problemes: articleReview.problemes,
          suggestions: articleReview.suggestions,
        },
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erreur lors de la correction");

      setFormData(prev => ({
        ...prev,
        content: data.fixedContent,
      }));

      setArticleReview(null);
      setReviewModalOpen(false);
      toast.success("Corrections appliquées ! Vérifiez le contenu puis relancez l'analyse si besoin.");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la correction automatique");
    } finally {
      setLoadingFix(false);
    }
  };

  return {
    wizardOpen, setWizardOpen, openWizard,
    loadingAngles, angles,
    loadingArticle, generatedArticle,
    handleGenerateAngles, handleSelectAngle, handleSelectArticle,
    generatingArticle: loadingAngles || loadingArticle,
    // Review
    reviewModalOpen, setReviewModalOpen, openReviewModal,
    loadingReview, articleReview, handleStartReview,
    // Fix
    loadingFix, handleApplyFixes,
  };
}
