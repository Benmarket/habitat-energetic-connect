import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useSearchParams, Link } from "react-router-dom";
import { CollectionPageSchema } from "@/components/SEO/CollectionPageSchema";
import { Breadcrumb } from "@/components/Breadcrumb";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2 } from "lucide-react";

const Aides = () => {
  const [searchParams] = useSearchParams();
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
      .eq("content_type", "aide")
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
        .eq("content_type", "aide")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        let filteredData = data;
        if (activeFilter !== "toutes") {
          filteredData = data.filter((post: any) => 
            post.post_categories?.some((pc: any) => 
              pc.categories?.slug === activeFilter
            )
          );
        }

        setPosts(filteredData);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const extractConditions = (content: string): string[] => {
    const conditions: string[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const lists = doc.querySelectorAll('ul li, ol li');
    
    lists.forEach((item, index) => {
      if (index < 3) {
        const text = item.textContent?.trim();
        if (text) conditions.push(text);
      }
    });
    
    return conditions.length > 0 ? conditions : ['Installation par un professionnel', 'Logement de plus de 2 ans'];
  };

  const extractAmount = (content: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const strongTags = doc.querySelectorAll('strong, b');
    
    for (const tag of Array.from(strongTags)) {
      const text = tag.textContent || '';
      if (text.match(/\d+\s*€/) || text.toLowerCase().includes('jusqu')) {
        return text;
      }
    }
    
    return "Montant variable";
  };

  return (
    <>
      <Helmet>
        <title>Aides & Subventions Énergies Renouvelables 2025 | Prime Énergies</title>
        <meta 
          name="description" 
          content="Découvrez toutes les aides financières disponibles pour votre projet d'énergies renouvelables : CEE, MaPrimeRénov, TVA réduite" 
        />
        <link rel="canonical" href="https://prime-energies.fr/aides" />
        <meta property="og:url" content="https://prime-energies.fr/aides" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Aides & Subventions Énergies Renouvelables 2025 | Prime Énergies" />
        <meta property="og:description" content="Découvrez toutes les aides financières disponibles pour votre projet d'énergies renouvelables : CEE, MaPrimeRénov, TVA réduite" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="Prime Énergies" />
        <meta property="og:image" content="https://prime-energies.fr/og-default.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Aides & Subventions Énergies Renouvelables 2025 | Prime Énergies" />
        <meta name="twitter:description" content="Découvrez toutes les aides financières disponibles pour votre projet d'énergies renouvelables : CEE, MaPrimeRénov, TVA réduite" />
        <meta name="twitter:image" content="https://prime-energies.fr/og-default.jpg" />
      </Helmet>
      {!loading && posts.length > 0 && (
        <CollectionPageSchema
          name="Aides & Subventions Énergies Renouvelables 2025"
          description="Découvrez toutes les aides financières disponibles pour votre projet d'énergies renouvelables : CEE, MaPrimeRénov, TVA réduite"
          url="https://prime-energies.fr/aides"
          items={posts.map((post) => ({
            title: post.title,
            url: `https://prime-energies.fr/aide/${post.slug}`,
            description: post.excerpt || "",
          }))}
        />
      )}

      <div className="min-h-screen bg-background">
        <Header />
        <Breadcrumb 
          items={[
            { name: "Accueil", url: "/" },
            { name: "Aides & Subventions", url: "/aides" }
          ]}
        />
        
        <main className="pt-20">
          {/* Hero Section */}
          <section className="relative py-20 overflow-hidden bg-gradient-to-br from-[hsl(210,80%,45%)] via-[hsl(215,75%,50%)] to-[hsl(220,70%,55%)]">
            {/* Background decorative elements with floating animation */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 animate-float-bubble-1" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3 animate-float-bubble-2" />
              <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-white/3 rounded-full animate-float-bubble-3" />
              <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white/5 rounded-full animate-float-bubble-1" style={{ animationDelay: '2s' }} />
              <div className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-white/5 rounded-full animate-float-bubble-2" style={{ animationDelay: '4s' }} />
            </div>
            
            <div className="container mx-auto px-4 relative z-10">
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Aides & Subventions 2025
              </h1>
              <p className="text-xl text-white/80 max-w-3xl">
                Toutes les aides financières disponibles pour financer vos travaux de rénovation énergétique
              </p>
            </div>
          </section>

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

          <section className="py-12">
            <div className="container mx-auto px-4">
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune aide disponible pour cette catégorie
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => {
                    const conditions = extractConditions(post.content);
                    const amount = extractAmount(post.content);

                    return (
                      <Card key={post.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-xl mb-2">{post.title}</CardTitle>
                          <CardDescription className="text-base">
                            {post.excerpt}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Badge variant="secondary" className="mb-4 text-sm px-4 py-2 bg-primary/10 text-primary border-primary/20">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {amount}
                          </Badge>

                          <div className="space-y-2 mb-4">
                            <p className="text-sm font-semibold text-foreground">Conditions :</p>
                            {conditions.map((condition, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-muted-foreground">{condition}</span>
                              </div>
                            ))}
                          </div>

                          <Link to={`/aide/${post.slug}`}>
                            <Button variant="outline" className="w-full">
                              En savoir plus
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    );
                  })}
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

export default Aides;
