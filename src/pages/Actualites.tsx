import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import ArticleCard from "@/components/ArticleCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import solarPanels from "@/assets/solar-panels.jpg";
import windTurbine from "@/assets/wind-turbine.jpg";
import energyDashboard from "@/assets/energy-dashboard.jpg";

const Actualites = () => {
  const [activeFilter, setActiveFilter] = useState("toutes");
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [activeFilter]);

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

    if (activeFilter !== "toutes") {
      // Filter by category slug
      query = query.contains("post_categories", [{ categories: { slug: activeFilter } }]);
    }

    const { data } = await query;
    
    if (data) {
      // Transform data to match ArticleCard props
      const transformedData = data.map(post => ({
        ...post,
        category: post.post_categories?.[0]?.categories?.name || "Général",
        categorySlug: post.post_categories?.[0]?.categories?.slug || "general",
      }));
      setPosts(transformedData);
    }
    setLoading(false);
  };

  // Mock data for initial display
  const mockPosts = [
    {
      id: "1",
      title: "Nouvelle hausse des aides pour l'installation de panneaux solaires en 2024",
      excerpt: "Le gouvernement annonce une augmentation significative des subventions pour encourager la transition énergétique...",
      featuredImage: solarPanels,
      category: "Aides",
      categorySlug: "aides",
      publishedAt: "2024-01-15",
      contentType: "actualite" as const,
      slug: "nouvelle-hausse-aides-panneaux-solaires-2024",
    },
    {
      id: "2",
      title: "L'éolien domestique : une solution d'avenir pour les zones rurales",
      excerpt: "De plus en plus de particuliers en zone rurale se tournent vers les éoliennes domestiques pour compléter leur production d'énergie...",
      featuredImage: windTurbine,
      category: "Éolien",
      categorySlug: "eolien",
      publishedAt: "2024-01-12",
      contentType: "actualite" as const,
      slug: "eolien-domestique-solution-avenir-zones-rurales",
    },
    {
      id: "3",
      title: "Autoconsommation : comment optimiser votre production solaire",
      excerpt: "Découvrez les meilleures stratégies pour maximiser l'utilisation de votre énergie solaire et réduire votre facture...",
      featuredImage: energyDashboard,
      category: "Solaire",
      categorySlug: "solaire",
      publishedAt: "2024-01-10",
      contentType: "actualite" as const,
      slug: "autoconsommation-optimiser-production-solaire",
    },
  ];

  const displayPosts = posts.length > 0 ? posts : mockPosts;

  return (
    <>
      <Helmet>
        <title>Actualités Énergies Renouvelables | Prime Énergies</title>
        <meta 
          name="description" 
          content="Restez informés des dernières innovations, aides publiques et tendances du secteur des énergies renouvelables" 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="bg-muted py-16">
            <div className="container mx-auto px-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Actualités Énergies Renouvelables
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl">
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
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {displayPosts.map((post) => (
                    <ArticleCard key={post.id} {...post} />
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default Actualites;
