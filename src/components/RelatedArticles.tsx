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
  published_at: string | null;
  categorySlug?: string;
  score: number;
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
      // Fetch a larger pool of candidates to score and rank
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image,
          content_type,
          published_at,
          post_categories(
            categories(slug)
          )
        `)
        .eq("status", "published")
        .eq("content_type", contentType)
        .neq("id", currentArticleId)
        .order("published_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      if (!data || data.length === 0) {
        setArticles([]);
        return;
      }

      // Fetch view counts for these articles
      const slugUrls = data.map((a: any) => {
        const catSlug = a.post_categories?.[0]?.categories?.slug || "general";
        return `/actualites/${catSlug}/${a.slug}`;
      });

      const { data: viewsData } = await supabase
        .from("page_views")
        .select("page_url")
        .in("page_url", slugUrls);

      // Count views per URL
      const viewsMap: Record<string, number> = {};
      viewsData?.forEach((pv: any) => {
        viewsMap[pv.page_url] = (viewsMap[pv.page_url] || 0) + 1;
      });

      const now = Date.now();

      // Score each article: theme match (50pts) + freshness (30pts) + popularity (20pts)
      const scored: RelatedArticle[] = data.map((article: any) => {
        const artCatSlug = article.post_categories?.[0]?.categories?.slug || "general";
        const articleUrl = `/actualites/${artCatSlug}/${article.slug}`;
        const views = viewsMap[articleUrl] || 0;

        // 1. Theme score: same category = 50, different = 0
        const themeScore = (categorySlug && artCatSlug === categorySlug) ? 50 : 0;

        // 2. Freshness score: 0-30 based on recency (max 30 for today, decays over 30 days)
        const publishedAt = article.published_at ? new Date(article.published_at).getTime() : 0;
        const ageInDays = Math.max(0, (now - publishedAt) / (1000 * 60 * 60 * 24));
        const freshnessScore = Math.max(0, 30 - ageInDays);

        // 3. Popularity score: 0-20 based on views (logarithmic scale)
        const popularityScore = views > 0 ? Math.min(20, Math.log10(views + 1) * 10) : 0;

        const score = themeScore + freshnessScore + popularityScore;

        return {
          id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          featured_image: article.featured_image,
          content_type: article.content_type,
          published_at: article.published_at,
          categorySlug: artCatSlug,
          score,
        };
      });

      // Sort by score descending
      scored.sort((a, b) => b.score - a.score);

      // Pick top 6, then randomly select 3 for rotation
      const topCandidates = scored.slice(0, Math.min(6, scored.length));
      const selected: RelatedArticle[] = [];
      const pool = [...topCandidates];
      
      while (selected.length < 3 && pool.length > 0) {
        const idx = Math.floor(Math.random() * pool.length);
        selected.push(pool.splice(idx, 1)[0]);
      }

      setArticles(selected);
    } catch (error) {
      console.error("Error fetching related articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const getArticleUrl = (article: RelatedArticle) => {
    if (article.content_type === "actualite") {
      const catSlug = article.categorySlug || "general";
      return `/actualites/${catSlug}/${article.slug}`;
    } else if (article.content_type === "guide") {
      return `/guide/${article.slug}`;
    } else if (article.content_type === "aide") {
      return `/aide/${article.slug}`;
    }
    return "#";
  };

  const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case "actualite": return "Actualités";
      case "guide": return "Guides";
      case "aide": return "Aides";
      case "annonce": return "Annonces";
      default: return "Articles";
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
