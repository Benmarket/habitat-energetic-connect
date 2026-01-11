import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { GuideSection } from "@/components/GuideSectionsEditor";

// Types
export interface Author {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface CreatePostFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  meta_title: string;
  meta_description: string;
  focus_keywords: string[];
  tldr: string;
  faq: Array<{ question: string; answer: string }>;
  status: string;
  category_id: string;
  tag_ids: string[];
  hide_author: boolean;
  author_display_type: "none" | "user" | "custom" | "author";
  display_author_id: string;
  custom_author_name: string;
  is_members_only: boolean;
  guide_template: "" | "classique" | "premium" | "expert" | "epure" | "vibrant" | "sombre";
  is_downloadable: boolean;
  guide_sections: GuideSection[];
  topline: string;
  topline_bg_color: string;
  topline_text_color: string;
}

// Validation schema
export const postSchema = z.object({
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

// Helper functions
export const parseContentToSections = (htmlContent: string): GuideSection[] => {
  const sections: GuideSection[] = [];
  const sectionRegex = /<h2[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h2>([\s\S]*?)(?=<h2|$)/gi;
  let match;
  let index = 0;
  
  while ((match = sectionRegex.exec(htmlContent)) !== null) {
    const id = match[1] || `section-${Date.now()}-${index}`;
    const title = match[2].trim();
    const content = match[3].trim();
    
    if (title || content) {
      sections.push({ id, title, content });
      index++;
    }
  }
  
  if (sections.length === 0) {
    const simpleRegex = /<h2[^>]*>([^<]*)<\/h2>([\s\S]*?)(?=<h2|$)/gi;
    while ((match = simpleRegex.exec(htmlContent)) !== null) {
      const title = match[1].trim();
      const content = match[2].trim();
      
      if (title || content) {
        sections.push({
          id: `section-${Date.now()}-${index}`,
          title,
          content
        });
        index++;
      }
    }
  }
  
  return sections;
};

export const sectionsToContent = (sections: GuideSection[]): string => {
  return sections
    .filter(s => s.title.trim() || s.content.trim())
    .map(section => {
      const sectionId = section.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || section.id;
      
      return `<h2 id="${sectionId}">${section.title}</h2>\n${section.content}`;
    })
    .join('\n\n');
};

export const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const initialFormData: CreatePostFormData = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featured_image: "",
  meta_title: "",
  meta_description: "",
  focus_keywords: [],
  tldr: "",
  faq: [],
  status: "draft",
  category_id: "",
  tag_ids: [],
  hide_author: true,
  author_display_type: "none",
  display_author_id: "",
  custom_author_name: "",
  is_members_only: false,
  guide_template: "",
  is_downloadable: true,
  guide_sections: [{ id: 'section-initial', title: '', content: '' }],
  topline: "",
  topline_bg_color: "#22c55e",
  topline_text_color: "#ffffff",
};

export function useCreatePost() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contentType = searchParams.get("type") || "actualite";
  const editId = searchParams.get("edit");
  
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [formData, setFormData] = useState<CreatePostFormData>(initialFormData);
  const [availableAuthors, setAvailableAuthors] = useState<Author[]>([]);
  const [userProfile, setUserProfile] = useState<{ first_name: string | null; last_name: string | null } | null>(null);
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
    fetchAuthors();
    fetchUserProfile();
    loadAiInstructions();
  }, [contentType]);

  useEffect(() => {
    if (editId && user) {
      loadPostForEdit(editId);
    }
  }, [editId, user]);

  const fetchAuthors = async () => {
    const { data } = await supabase
      .from("authors")
      .select("*")
      .order("name");
    if (data) setAvailableAuthors(data);
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();
    if (data) setUserProfile(data);
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
    } catch {
      // Silent fail
    }
  };

  const loadPostForEdit = async (postId: string) => {
    setLoadingPost(true);
    try {
      const { data: post, error: postError } = await supabase
        .from("posts")
        .select(`*, post_categories(category_id), post_tags(tag_id)`)
        .eq("id", postId)
        .single();

      if (postError) throw postError;

      if (post) {
        let authorDisplayType: "none" | "user" | "custom" | "author" = "none";
        if (post.display_author_id) {
          authorDisplayType = "author";
        } else if (post.author_display_type === "user") {
          authorDisplayType = "user";
        } else if (!post.hide_author) {
          authorDisplayType = "user";
        }
        
        let guideSections: GuideSection[] = [{ id: 'section-initial', title: '', content: '' }];
        
        if (post.content_type === 'guide' && post.content) {
          const parsedSections = parseContentToSections(post.content);
          if (parsedSections.length > 0) {
            guideSections = parsedSections;
          }
        }
        
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
          hide_author: post.hide_author ?? true,
          author_display_type: authorDisplayType,
          display_author_id: post.display_author_id || "",
          custom_author_name: "",
          is_members_only: post.is_members_only ?? false,
          guide_template: (post.guide_template as CreatePostFormData['guide_template']) || "",
          is_downloadable: post.is_downloadable ?? true,
          guide_sections: guideSections,
          topline: (post as any).topline || "",
          topline_bg_color: (post as any).topline_bg_color || "#22c55e",
          topline_text_color: (post as any).topline_text_color || "#ffffff",
        });
      }
    } catch {
      toast.error("Erreur lors du chargement de l'article");
    } finally {
      setLoadingPost(false);
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
      const finalContent = contentType === 'guide' 
        ? sectionsToContent(formData.guide_sections)
        : formData.content;
      
      if (contentType === 'guide' && !formData.guide_template) {
        toast.error("Veuillez sélectionner un template pour le guide");
        setLoading(false);
        return;
      }
      
      if (contentType === 'guide') {
        const validSections = formData.guide_sections.filter(s => s.title.trim() || s.content.trim());
        if (validSections.length === 0) {
          toast.error("Veuillez ajouter au moins une section avec du contenu");
          setLoading(false);
          return;
        }
      }
      
      const validatedData = postSchema.parse({
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: finalContent,
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

      if (!formData.hide_author && formData.author_display_type === "custom") {
        toast.error("Veuillez créer l'auteur avant de publier l'article");
        setLoading(false);
        return;
      }

      const postData: any = {
        title: validatedData.title,
        slug: validatedData.slug,
        content: validatedData.content,
        content_type: contentType as "actualite" | "guide" | "aide" | "annonce",
        status,
        hide_author: formData.hide_author,
        author_display_type: formData.hide_author ? "none" : formData.author_display_type,
        display_author_id: formData.author_display_type === "author" ? formData.display_author_id || null : null,
        custom_author_name: formData.author_display_type === "custom" ? formData.custom_author_name || null : null,
      };

      if (contentType === "guide") {
        postData.is_members_only = formData.is_members_only;
        postData.guide_template = formData.guide_template;
        postData.is_downloadable = formData.is_downloadable;
        postData.topline = formData.topline || null;
        postData.topline_bg_color = formData.topline_bg_color || "#22c55e";
        postData.topline_text_color = formData.topline_text_color || "#ffffff";
      }

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
        const { error: updateError } = await supabase
          .from("posts")
          .update(postData)
          .eq("id", editId);

        if (updateError) throw updateError;

        await supabase.from("post_categories").delete().eq("post_id", editId);
        await supabase.from("post_tags").delete().eq("post_id", editId);
      } else {
        postData.author_id = user!.id;
        
        const { data: post, error: postError } = await supabase
          .from("posts")
          .insert(postData)
          .select()
          .single();

        if (postError) throw postError;
        postId = post.id;
      }

      const { error: categoryError } = await supabase
        .from("post_categories")
        .insert({
          post_id: postId,
          category_id: formData.category_id,
        });

      if (categoryError) throw categoryError;

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
      
      // Redirect based on content type
      const redirectMap: Record<string, string> = {
        guide: "/gerer-guides",
        aide: "/gerer-aides",
        actualite: "/gerer-actualites",
        annonce: "/gerer-annonces",
      };
      navigate(redirectMap[contentType] || "/gerer-actualites");
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

  return {
    user,
    authLoading,
    loading,
    loadingPost,
    contentType,
    editId,
    categories,
    tags,
    formData,
    setFormData,
    availableAuthors,
    setAvailableAuthors,
    userProfile,
    defaultAiInstructions,
    currentAiInstructions,
    setCurrentAiInstructions,
    handleTitleChange,
    handleSubmit,
    fetchAuthors,
  };
}
