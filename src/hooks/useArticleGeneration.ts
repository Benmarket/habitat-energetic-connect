// useArticleGeneration v3 - fixed auth headers
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseContentToSections, sectionsToContent, CreatePostFormData, generateSlug } from "./useCreatePost";
import { GuideSection } from "@/components/GuideSectionsEditor";

export function useArticleGeneration(
  formData: CreatePostFormData,
  setFormData: React.Dispatch<React.SetStateAction<CreatePostFormData>>,
  contentType: string,
  currentAiInstructions: string,
  userId?: string
) {
  const [generatingArticle, setGeneratingArticle] = useState(false);
  const [variantsModalOpen, setVariantsModalOpen] = useState(false);
  const [generatedVariants, setGeneratedVariants] = useState<any>(null);
  const [regeneratingVariantId, setRegeneratingVariantId] = useState<number | null>(null);
  const [previousVariantVersions, setPreviousVariantVersions] = useState<Map<number, any>>(new Map());

  const handleGenerateArticle = async () => {
    if (formData.focus_keywords.length === 0) {
      toast.error("Veuillez ajouter au moins un mot-clé avant de générer un article");
      return;
    }

    if (contentType === 'guide' && !formData.guide_template) {
      toast.error("Veuillez sélectionner un thème de guide avant de générer");
      return;
    }

    setGeneratingArticle(true);
    setVariantsModalOpen(true);

    try {
      // Récupérer la session pour le token d'authentification
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        toast.error("Vous devez être connecté pour générer un article");
        setGeneratingArticle(false);
        setVariantsModalOpen(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: {
          keywords: formData.focus_keywords,
          contentType: contentType,
          customInstructions: currentAiInstructions,
          guideTemplate: contentType === 'guide' ? formData.guide_template : undefined,
          userId: userId
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Erreur lors de la génération");
      }

      const variantsWithImages = await Promise.all(
        data.variants.map(async (variant: any) => {
          const imageMatches = variant.content?.match(/\[IMAGE:\s*([^\]]+)\]/g) || [];
          const imageDescriptions = imageMatches.map((match: string) => 
            match.replace(/\[IMAGE:\s*/, '').replace(/\]/, '').trim()
          );

          let contentWithImages = variant.content || '';
          let featuredImageUrl = '';

          if (imageDescriptions.length > 0 && userId) {
            try {
              const { data: imagesData, error: imagesError } = await supabase.functions.invoke('generate-images', {
                body: {
                  imageDescriptions: imageDescriptions,
                },
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });

              if (!imagesError && imagesData?.success && imagesData.images) {
                const firstSuccessImage = imagesData.images.find((img: any) => img.success);
                if (firstSuccessImage) {
                  featuredImageUrl = firstSuccessImage.url;
                }

                imagesData.images.forEach((imgData: any, index: number) => {
                  if (imgData.success && imageMatches[index]) {
                    const imgTag = `<img src="${imgData.url}" alt="${imgData.description}" class="rounded-lg max-w-full h-auto my-4" />`;
                    contentWithImages = contentWithImages.replace(imageMatches[index], imgTag);
                  }
                });
              }
            } catch {
              // Silent fail
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
      toast.error(error.message || "Erreur lors de la génération de l'article");
      setVariantsModalOpen(false);
    } finally {
      setGeneratingArticle(false);
    }
  };

  const handleSelectVariant = async (variant: any) => {
    let guideSections = formData.guide_sections;
    if (contentType === 'guide' && variant.content) {
      const parsedSections = parseContentToSections(variant.content);
      if (parsedSections.length > 0) {
        guideSections = parsedSections;
      } else {
        guideSections = [{
          id: `section-${Date.now()}`,
          title: 'Introduction',
          content: variant.content
        }];
      }
    }
    
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
      faq: variant.faq || [],
      guide_sections: contentType === 'guide' ? guideSections : prev.guide_sections,
      // Conserver les champs topline et badge_image existants (ne pas écraser avec des valeurs vides)
      topline: variant.topline || prev.topline,
      topline_bg_color: variant.topline_bg_color || prev.topline_bg_color,
      topline_text_color: variant.topline_text_color || prev.topline_text_color,
      badge_image: variant.badge_image || prev.badge_image,
    }));

    toast.success(contentType === 'guide' ? "Guide sélectionné ! Tous les champs ont été remplis." : "Article sélectionné ! Tous les champs ont été remplis.");
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

      if (!previousVariantVersions.has(variantId)) {
        setPreviousVariantVersions(prev => new Map(prev).set(variantId, { ...currentVariant }));
      }

      // Récupérer la session pour le token d'authentification
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        toast.error("Session expirée, veuillez vous reconnecter");
        setRegeneratingVariantId(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: { 
          keywords: formData.focus_keywords.length > 0 ? formData.focus_keywords : ['panneau solaire'],
          contentType: contentType,
          baseContent: currentVariant.content,
          additionalInstructions: instructions,
          customInstructions: currentAiInstructions,
          guideTemplate: contentType === 'guide' ? formData.guide_template : undefined,
          userId: userId,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (error) throw new Error(error.message || "Erreur lors de l'appel à l'edge function");
      if (!data) throw new Error("Aucune donnée reçue de l'edge function");
      if (!data.success) throw new Error(data.error || "La génération a échoué");
      if (!data.variants || data.variants.length === 0) throw new Error("Aucune variante générée");

      const regeneratedVariant = data.variants[0];
      
      const imageDescription = regeneratedVariant.imageDescription || 
        `Image pour l'article: ${regeneratedVariant.title}`;
      
      const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-images', {
        body: { imageDescriptions: [imageDescription] },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const firstOk = imageData?.images?.find?.((img: any) => img?.success);
      if (!imageError && firstOk?.url) {
        regeneratedVariant.featuredImageUrl = firstOk.url;
      }

      setGeneratedVariants((prev: any) => 
        prev.map((v: any) => v.id === variantId ? { ...regeneratedVariant, id: variantId } : v)
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
      
      setPreviousVariantVersions(prev => {
        const newMap = new Map(prev);
        newMap.delete(variantId);
        return newMap;
      });
      
      toast.success("Version précédente restaurée");
    }
  };

  return {
    generatingArticle,
    variantsModalOpen,
    setVariantsModalOpen,
    generatedVariants,
    regeneratingVariantId,
    previousVariantVersions,
    handleGenerateArticle,
    handleSelectVariant,
    handleRegenerateVariant,
    handleRestorePreviousVersion,
  };
}
