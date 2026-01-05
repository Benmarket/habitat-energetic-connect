import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useSearchParams } from "react-router-dom";
import { CollectionPageSchema } from "@/components/SEO/CollectionPageSchema";
import { Breadcrumb } from "@/components/Breadcrumb";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Actualites = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState(searchParams.get("category") || "toutes");
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [activeFilter]);

  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setActiveFilter(category);
    }
  }, [searchParams]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("content_type", "actualite")
      .order("name");
    
    if (data) setCategories(data);
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("posts")
        .select(`
          *,
          post_categories(
            categories(id, name, slug)
          )
        `)
        .eq("content_type", "actualite")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        // Filter by category if needed
        let filteredData = data;
        if (activeFilter !== "toutes") {
          filteredData = data.filter((post: any) => 
            post.post_categories?.some((pc: any) => 
              pc.categories?.slug === activeFilter
            )
          );
        }

        // Transform data to match ArticleCard props
        const transformedData = filteredData.map(post => ({
          ...post,
          category: post.post_categories?.[0]?.categories?.name || "Général",
          categorySlug: post.post_categories?.[0]?.categories?.slug || "general",
          publishedAt: post.published_at,
          featuredImage: post.featured_image,
          contentType: post.content_type,
        }));
        setPosts(transformedData);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Actualités Énergies Renouvelables | Prime Énergies</title>
        <meta 
          name="description" 
          content="Restez informés des dernières innovations, aides publiques et tendances du secteur des énergies renouvelables" 
        />
        <link rel="canonical" href="https://prime-energies.fr/actualites" />
        <meta property="og:url" content="https://prime-energies.fr/actualites" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Actualités Énergies Renouvelables | Prime Énergies" />
        <meta property="og:description" content="Restez informés des dernières innovations, aides publiques et tendances du secteur des énergies renouvelables" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="Prime Énergies" />
        <meta property="og:image" content="https://prime-energies.fr/og-default.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Actualités Énergies Renouvelables | Prime Énergies" />
        <meta name="twitter:description" content="Restez informés des dernières innovations, aides publiques et tendances du secteur des énergies renouvelables" />
        <meta name="twitter:image" content="https://prime-energies.fr/og-default.jpg" />
      </Helmet>
      {!loading && posts.length > 0 && (
        <CollectionPageSchema
          name="Actualités Énergies Renouvelables"
          description="Restez informés des dernières innovations, aides publiques et tendances du secteur des énergies renouvelables"
          url="https://prime-energies.fr/actualites"
          items={posts.map((post) => ({
            title: post.title,
            url: `https://prime-energies.fr/actualites/${post.categorySlug}/${post.slug}`,
            description: post.excerpt || "",
            imageUrl: post.featuredImage || undefined,
          }))}
        />
      )}

      <div className="min-h-screen bg-background">
        <Header />
        <Breadcrumb 
          items={[
            { name: "Accueil", url: "/" },
            { name: "Actualités", url: "/actualites" }
          ]}
        />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="relative py-20 overflow-hidden bg-gradient-to-br from-[hsl(210,80%,45%)] via-[hsl(215,75%,50%)] to-[hsl(220,70%,55%)]">
            {/* Background decorative elements */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
              <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-white/3 rounded-full" />
            </div>
            
            <div className="container mx-auto px-4 relative z-10">
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Actualités Énergies Renouvelables
              </h1>
              <p className="text-xl text-white/80 max-w-3xl">
                Restez informés des dernières innovations, aides publiques et tendances du secteur
              </p>
            </div>
          </section>

          {/* Filters */}
          <section className="py-8 border-b border-border">
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={activeFilter === "toutes" ? "default" : "outline"}
                  onClick={() => setActiveFilter("toutes")}
                >
                  Toutes
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeFilter === category.slug ? "default" : "outline"}
                    onClick={() => setActiveFilter(category.slug)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </section>

          {/* Articles Grid */}
          <section className="py-12">
            <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucune actualité disponible pour cette catégorie
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <ArticleCard key={post.id} {...post} />
              ))}
            </div>
          )}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Actualites;
