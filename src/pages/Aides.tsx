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
import { Loader2, CheckCircle2, Lightbulb, Calculator, Zap, ArrowRight, User, Briefcase } from "lucide-react";

const Aides = () => {
  const [searchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState(searchParams.get("category") || "toutes");
  const [audienceFilter, setAudienceFilter] = useState(searchParams.get("audience") || "toutes");
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchPosts();
  }, [activeFilter, audienceFilter]);

  useEffect(() => {
    const category = searchParams.get("category");
    const audience = searchParams.get("audience");
    if (category) {
      setActiveFilter(category);
    }
    if (audience) {
      setAudienceFilter(audience);
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
        
        // Filter by category
        if (activeFilter !== "toutes") {
          filteredData = filteredData.filter((post: any) => 
            post.post_categories?.some((pc: any) => 
              pc.categories?.slug === activeFilter
            )
          );
        }
        
        // Filter by audience
        if (audienceFilter !== "toutes") {
          filteredData = filteredData.filter((post: any) => 
            post.target_audience?.includes(audienceFilter)
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

          {/* Audience Filter */}
          <section className="py-6 border-b border-border bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Public cible :</span>
                <Button
                  variant={audienceFilter === "toutes" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAudienceFilter("toutes")}
                  className="gap-2"
                >
                  Toutes
                </Button>
                <Button
                  variant={audienceFilter === "particulier" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAudienceFilter("particulier")}
                  className="gap-2"
                >
                  <User className="w-4 h-4" />
                  Particuliers
                </Button>
                <Button
                  variant={audienceFilter === "professionnel" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAudienceFilter("professionnel")}
                  className="gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  Professionnels
                </Button>
              </div>
            </div>
          </section>

          {/* Category Filter */}
          <section className="py-6 border-b border-border">
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Catégorie :</span>
                <Button
                  variant={activeFilter === "toutes" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter("toutes")}
                >
                  Toutes
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeFilter === category.slug ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveFilter(category.slug)}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </section>

          <section className="py-12 bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-blue-950/20 dark:via-background dark:to-background relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-20 right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-20 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
            </div>
            
            <div className="container mx-auto px-4 relative z-10">
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune aide disponible pour cette catégorie
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post, index) => {
                    const conditions = extractConditions(post.content);
                    const amount = extractAmount(post.content);
                    const iconMap: { [key: number]: any } = { 0: Lightbulb, 1: Calculator, 2: Zap };
                    const Icon = iconMap[index % 3] || Lightbulb;
                    const category = post.post_categories?.[0]?.categories;

                    return (
                      <Card 
                        key={post.id} 
                        className="group hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105 hover:-translate-y-1 h-full flex flex-col border-2 border-blue-500/20 hover:border-blue-500/40 overflow-hidden bg-card/80 backdrop-blur-sm"
                      >
                        <CardHeader className="flex-shrink-0 pb-3">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/20 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                              <Icon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base md:text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors font-bold leading-tight">
                                {post.title}
                              </CardTitle>
                              <div className="flex flex-wrap gap-1.5 mb-1.5">
                                {category && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-blue-500/10 text-blue-700 border-blue-500/30 font-semibold px-2 py-0.5"
                                  >
                                    {category.name}
                                  </Badge>
                                )}
                                {post.target_audience?.includes('particulier') && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-green-500/10 text-green-700 border-green-500/30 font-semibold px-2 py-0.5"
                                  >
                                    <User className="w-2.5 h-2.5 mr-1" />
                                    Particulier
                                  </Badge>
                                )}
                                {post.target_audience?.includes('professionnel') && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/30 font-semibold px-2 py-0.5"
                                  >
                                    <Briefcase className="w-2.5 h-2.5 mr-1" />
                                    Professionnel
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <CardDescription className="text-xs md:text-sm line-clamp-2 leading-snug">
                            {post.excerpt}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex flex-col justify-between pt-2 pb-4">
                          <div>
                            <Badge
                              variant="secondary"
                              className="mb-3 text-xs px-3 py-1 bg-blue-500/10 text-blue-700 border-blue-500/20"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1.5" />
                              <span className="line-clamp-1">{amount}</span>
                            </Badge>

                            <div className="space-y-1.5 mb-4">
                              <p className="text-xs font-semibold text-foreground">Conditions :</p>
                              {conditions.slice(0, 3).map((condition, idx) => (
                                <div key={idx} className="flex items-start gap-1.5">
                                  <CheckCircle2 className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-xs text-muted-foreground line-clamp-1 leading-tight">
                                    {condition}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Link to={`/aide/${post.slug}`} className="mt-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-blue-500/30 text-blue-700 hover:bg-blue-600 hover:text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 text-xs"
                            >
                              En savoir plus
                              <ArrowRight className="w-3 h-3 ml-2 inline group-hover:translate-x-1 transition-transform" />
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
