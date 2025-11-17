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

interface Category {
  id: string;
  name: string;
  slug: string;
}

const NewsSection = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchRecentNews();
  }, []);

  useEffect(() => {
    fetchRecentNews();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("content_type", "actualite")
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchRecentNews = async () => {
    try {
      let query = supabase
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
              id,
              name,
              slug
            )
          )
        `)
        .eq("content_type", "actualite")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3);

      const { data, error } = await query;

      if (error) throw error;
      
      let filteredPosts = data || [];
      
      if (selectedCategory) {
        filteredPosts = filteredPosts.filter((post: any) => 
          post.post_categories?.some((pc: any) => 
            pc.categories?.slug === selectedCategory
          )
        );
      }
      
      setPosts(filteredPosts);
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

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Actualités Énergies Renouvelables
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Restez informés des dernières innovations, aides publiques et tendances du secteur
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="rounded-full"
          >
            Toutes
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.slug ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.slug)}
              className="rounded-full"
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Aucune actualité disponible pour cette catégorie
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link to="/actualites">
            <Button variant="outline" size="lg" className="gap-2">
              Voir toutes les actualités
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
