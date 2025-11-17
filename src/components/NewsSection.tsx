import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ArticleCard from "./ArticleCard";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  published_at: string;
  content_type: "actualite" | "guide" | "aide";
}

const NewsSection = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentNews();
  }, []);

  const fetchRecentNews = async () => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image,
          published_at,
          content_type,
          post_categories (
            categories (
              name,
              slug
            )
          )
        `)
        .eq("content_type", "actualite")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">Chargement...</div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) return null;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-foreground">Actualités</h2>
          <Link to="/actualites">
            <Button variant="outline" className="gap-2">
              Voir toutes les actualités
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const category = (post as any).post_categories?.[0]?.categories;
            return (
              <ArticleCard
                key={post.id}
                id={post.id}
                title={post.title}
                excerpt={post.excerpt || ""}
                featuredImage={post.featured_image || "/placeholder.svg"}
                category={category?.name || "Actualité"}
                categorySlug={category?.slug || "general"}
                publishedAt={post.published_at}
                contentType={post.content_type}
                slug={post.slug}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
