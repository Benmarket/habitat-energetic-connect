import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { CollectionPageSchema } from "@/components/SEO/CollectionPageSchema";
import { Breadcrumb } from "@/components/Breadcrumb";
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
        <meta property="og:image" content="https://prime-energies.fr/og-default.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Guides Prime Énergies 2025 | Tous nos guides experts" />
        <meta name="twitter:description" content="Découvrez tous nos guides complets pour optimiser vos projets de rénovation énergétique et bénéficier des primes et aides disponibles en 2025." />
        <meta name="twitter:image" content="https://prime-energies.fr/og-default.jpg" />
      </Helmet>
      {!loading && guides.length > 0 && (
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
      )}

      <div className="min-h-screen bg-background">
        <Header />
        <Breadcrumb 
          items={[
            { name: "Accueil", url: "/" },
            { name: "Guides", url: "/guides" }
          ]}
        />
        
        <main className="relative">
          {/* Hero Section - Orange solid background */}
          <section className="relative py-20 overflow-hidden bg-gradient-to-br from-orange-500 via-orange-500/90 to-orange-600">
            {/* Background decorative elements with floating animation */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 animate-float-bubble-1" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3 animate-float-bubble-2" />
              <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-white/3 rounded-full animate-float-bubble-3" />
              <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white/5 rounded-full animate-float-bubble-1" style={{ animationDelay: '2s' }} />
              <div className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-white/5 rounded-full animate-float-bubble-2" style={{ animationDelay: '4s' }} />
            </div>
            
            <div className="container mx-auto px-4 relative z-10">
              <div className="text-center flex flex-col items-center">
                <div className="inline-flex items-center gap-3 mb-6 bg-white/10 px-8 py-4 rounded-full backdrop-blur-sm border-2 border-white/30 shadow-lg">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white">
                    Guides Prime Énergies 2025
                  </h1>
                </div>
                
                <p className="text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
                  Explorez notre bibliothèque complète de guides experts pour réussir vos projets de rénovation énergétique
                </p>
                
                <div className="flex items-center justify-center gap-2 mt-4">
                  <div className="h-1 w-16 bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full"></div>
                </div>
              </div>
            </div>
          </section>

          <div className="container mx-auto px-4 py-12">

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-56 w-full rounded-xl" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ))}
              </div>
            ) : guides.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl shadow-lg inline-block mb-6">
                  <BookOpen className="w-16 h-16 text-white" />
                </div>
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
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Guides;
