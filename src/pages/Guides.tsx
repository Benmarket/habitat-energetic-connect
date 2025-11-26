import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { CollectionPageSchema } from "@/components/SEO/CollectionPageSchema";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";

interface Guide {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  categories?: { name: string; slug: string }[];
}

const Guides = () => {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
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
          post_categories (
            categories (
              name,
              slug
            )
          )
        `)
        .eq("content_type", "guide")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (error) throw error;

      const formattedGuides = data?.map((guide: any) => ({
        ...guide,
        categories: guide.post_categories?.map((pc: any) => pc.categories).filter(Boolean) || [],
      })) || [];

      setGuides(formattedGuides);
    } catch (error) {
      console.error("Error fetching guides:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Guides Prime Énergies 2025 | Tous nos guides experts</title>
        <meta 
          name="description" 
          content="Découvrez tous nos guides complets pour optimiser vos projets de rénovation énergétique et bénéficier des primes et aides disponibles en 2025." 
        />
        <link rel="canonical" href="https://prime-energies.fr/guides" />
        <meta property="og:url" content="https://prime-energies.fr/guides" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Guides Prime Énergies 2025 | Tous nos guides experts" />
        <meta property="og:description" content="Découvrez tous nos guides complets pour optimiser vos projets de rénovation énergétique et bénéficier des primes et aides disponibles en 2025." />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="Prime Énergies" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Guides Prime Énergies 2025 | Tous nos guides experts" />
        <meta name="twitter:description" content="Découvrez tous nos guides complets pour optimiser vos projets de rénovation énergétique et bénéficier des primes et aides disponibles en 2025." />
      </Helmet>
      <CollectionPageSchema
        name="Guides Prime Énergies 2025"
        description="Découvrez tous nos guides complets pour optimiser vos projets de rénovation énergétique et bénéficier des primes et aides disponibles en 2025."
        url="https://prime-energies.fr/guides"
        items={guides.map((guide) => ({
          title: guide.title,
          url: `https://prime-energies.fr/guide/${guide.slug}`,
          description: guide.excerpt || "",
          imageUrl: guide.featured_image || undefined,
        }))}
      />

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-16">
          <div className="text-center mb-16 relative">
            <div className="absolute inset-0 -z-10 opacity-20">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
                <path fill="hsl(var(--primary))" fillOpacity="0.3" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,128C1248,117,1344,107,1392,101.3L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
              </svg>
            </div>
            
            <div className="inline-flex items-center gap-3 mb-6 bg-primary/10 px-8 py-4 rounded-full backdrop-blur-sm border border-primary/20">
              <BookOpen className="w-8 h-8 text-primary" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                Guides Prime Énergies 2025
              </h1>
            </div>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Explorez notre bibliothèque complète de guides experts pour réussir vos projets de rénovation énergétique
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-56 w-full" />
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : guides.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-24 h-24 mx-auto text-muted-foreground mb-6" />
              <h2 className="text-2xl font-semibold mb-4">Aucun guide disponible</h2>
              <p className="text-muted-foreground">
                Les guides seront bientôt disponibles. Revenez plus tard !
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {guides.map((guide) => (
                <ArticleCard
                  key={guide.id}
                  id={guide.id}
                  title={guide.title}
                  excerpt={guide.excerpt || ""}
                  slug={guide.slug}
                  featuredImage={guide.featured_image || ""}
                  publishedAt={guide.published_at || ""}
                  category={guide.categories?.[0]?.name || "Guide"}
                  categorySlug={guide.categories?.[0]?.slug || "guide"}
                  contentType="guide"
                />
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Guides;
