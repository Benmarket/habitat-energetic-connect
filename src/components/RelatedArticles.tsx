import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ContentType = Database["public"]["Enums"]["content_type"];

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  content_type: ContentType;
}

interface RelatedArticlesProps {
  currentArticleId: string;
  categorySlug?: string;
  contentType: ContentType;
}

export const RelatedArticles = ({
  currentArticleId,
  categorySlug,
  contentType,
}: RelatedArticlesProps) => {
  const [articles, setArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedArticles();
  }, [currentArticleId, categorySlug]);

  const fetchRelatedArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image,
          content_type,
          post_categories(
            categories(slug)
          )
        `)
        .eq("status", "published")
        .eq("content_type", contentType)
        .neq("id", currentArticleId)
        .limit(3);

      if (error) throw error;

      // Filter by category if provided
      let filteredArticles = data || [];
      if (categorySlug) {
        filteredArticles = filteredArticles.filter((article: any) =>
          article.post_categories?.some(
            (pc: any) => pc.categories?.slug === categorySlug
          )
        );
      }

      // If we don't have 3 articles with same category, add more from same content type
      if (filteredArticles.length < 3) {
        const { data: additionalData } = await supabase
          .from("posts")
          .select("id, title, slug, excerpt, featured_image, content_type")
          .eq("status", "published")
          .eq("content_type", contentType)
          .neq("id", currentArticleId)
          .limit(3 - filteredArticles.length);

        if (additionalData) {
          const additionalArticles = additionalData
            .filter((article) => !filteredArticles.find((fa: any) => fa.id === article.id))
            .map((article) => ({
              ...article,
              post_categories: [],
            }));

          filteredArticles = [...filteredArticles, ...additionalArticles] as any[];
        }
      }

      setArticles(filteredArticles.slice(0, 3) as RelatedArticle[]);
    } catch (error) {
      console.error("Error fetching related articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const getArticleUrl = (article: RelatedArticle) => {
    if (article.content_type === "actualite") {
      return `/actualites/general/${article.slug}`;
    } else if (article.content_type === "guide") {
      return `/guide/${article.slug}`;
    } else if (article.content_type === "aide") {
      return `/aide/${article.slug}`;
    }
    return "#";
  };

  const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case "actualite":
        return "Actualités";
      case "guide":
        return "Guides";
      case "aide":
        return "Aides";
      case "annonce":
        return "Annonces";
      default:
        return "Articles";
    }
  };

  if (loading || articles.length === 0) return null;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">
          {getContentTypeLabel(contentType)} connexes
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {articles.map((article) => (
            <Link key={article.id} to={getArticleUrl(article)}>
              <Card className="hover:shadow-lg transition-shadow h-full group">
                {article.featured_image && (
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={article.featured_image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center text-primary font-semibold text-sm group-hover:gap-2 transition-all">
                    Lire la suite
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
