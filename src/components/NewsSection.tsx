import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ArticleCard from "./ArticleCard";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  published_at: string;
  content_type: "actualite" | "guide" | "aide" | "annonce";
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
      // First fetch all categories
      const { data: allCategories, error: catError } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("content_type", "actualite")
        .order("name", { ascending: true });

      if (catError) throw catError;

      // Then fetch categories that have at least one published article
      const { data: postsWithCategories, error: postsError } = await supabase
        .from("posts")
        .select(`
          post_categories (
            categories (id)
          )
        `)
        .eq("content_type", "actualite")
        .eq("status", "published");

      if (postsError) throw postsError;

      // Extract unique category IDs that have published posts
      const categoryIdsWithPosts = new Set<string>();
      postsWithCategories?.forEach((post: any) => {
        post.post_categories?.forEach((pc: any) => {
          if (pc.categories?.id) {
            categoryIdsWithPosts.add(pc.categories.id);
          }
        });
      });

      // Filter categories to only show those with published posts
      const categoriesWithPosts = (allCategories || []).filter(
        cat => categoryIdsWithPosts.has(cat.id)
      );

      setCategories(categoriesWithPosts);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchRecentNews = async () => {
    try {
      // Fetch all published articles first, then filter and limit
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
              id,
              name,
              slug
            )
          )
        `)
        .eq("content_type", "actualite")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) throw error;
      
      let filteredPosts = data || [];
      
      // Filter by category if one is selected
      if (selectedCategory) {
        filteredPosts = filteredPosts.filter((post: any) => 
          post.post_categories?.some((pc: any) => 
            pc.categories?.slug === selectedCategory
          )
        );
      }
      
      // Limit to 3 posts AFTER filtering
      setPosts(filteredPosts.slice(0, 3));
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
    <section className="pt-2 md:pt-4 lg:pt-6 pb-8 md:pb-12 lg:pb-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-8 md:mb-12">
          <div className="w-16 h-1 bg-orange-500 mb-4"></div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Actualités Énergies Renouvelables
          </h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Restez informés des dernières innovations, aides publiques et tendances du secteur
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 md:mb-12">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            className="rounded-full text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 h-auto"
          >
            Toutes
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.slug ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.slug)}
              className="rounded-full text-xs md:text-sm px-3 md:px-4 py-1.5 md:py-2 h-auto"
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
          <>
            {/* Mobile & Tablet Carousel */}
            <div className="block lg:hidden">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {posts.map((post) => {
                    const category = (post as any).post_categories?.[0]?.categories;
                    return (
                      <CarouselItem key={post.id} className="md:basis-1/2">
                        <div className="px-2">
                          <ArticleCard
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
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                
                {/* Navigation and View All Button - Side by side */}
                <div className="flex items-center justify-between mt-8 px-4">
                  <div className="flex gap-2">
                    <CarouselPrevious className="relative inset-0 translate-y-0 h-9 w-9 md:h-11 md:w-11 bg-white hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 hover:scale-110 shadow-lg" />
                    <CarouselNext className="relative inset-0 translate-y-0 h-9 w-9 md:h-11 md:w-11 bg-white hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 hover:scale-110 shadow-lg" />
                  </div>
                  
                  <Link to="/actualites">
                    <Button variant="outline" className="gap-1.5 md:gap-2 text-xs md:text-sm px-3 md:px-4 py-2 md:py-2.5 h-auto whitespace-nowrap">
                      Voir toutes les actualités
                      <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </Button>
                  </Link>
                </div>
              </Carousel>
            </div>

            {/* Desktop Grid */}
            <div className="hidden lg:grid grid-cols-3 gap-8">
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
          </>
        )}

        {/* View All Button - Desktop only */}
        <div className="hidden lg:block text-center mt-12">
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
