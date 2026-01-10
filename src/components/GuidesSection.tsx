import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Guide {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  categories?: { name: string; slug: string }[];
}

const GuidesSection = () => {
  const [featuredGuide, setFeaturedGuide] = useState<Guide | null>(null);
  const [secondaryGuides, setSecondaryGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      // Récupérer les IDs des guides mis en avant depuis site_settings
      const { data: settings } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "featured_guides")
        .maybeSingle();

      let featuredId: string | null = null;
      let secondaryIds: string[] = [];

      if (settings?.value) {
        const value = settings.value as any;
        featuredId = value.featured_guide_id || null;
        secondaryIds = value.secondary_guide_ids || [];
      }

      // Si pas de sélection admin, prendre les 4 guides les plus récents
      if (!featuredId && secondaryIds.length === 0) {
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
          .order("published_at", { ascending: false })
          .limit(4);

        if (error) throw error;

        const formattedGuides = data?.map((guide: any) => ({
          ...guide,
          categories: guide.post_categories?.map((pc: any) => pc.categories).filter(Boolean) || [],
        })) || [];

        if (formattedGuides.length > 0) {
          setFeaturedGuide(formattedGuides[0]);
          setSecondaryGuides(formattedGuides.slice(1, 4));
        }
      } else {
        // Récupérer les guides sélectionnés par l'admin
        const allIds = [featuredId, ...secondaryIds].filter(Boolean) as string[];
        
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
          .in("id", allIds);

        if (error) throw error;

        const formattedGuides = data?.map((guide: any) => ({
          ...guide,
          categories: guide.post_categories?.map((pc: any) => pc.categories).filter(Boolean) || [],
        })) || [];

        // Trier selon l'ordre défini
        const featured = formattedGuides.find(g => g.id === featuredId) || null;
        const secondary = secondaryIds
          .map(id => formattedGuides.find(g => g.id === id))
          .filter(Boolean) as Guide[];

        setFeaturedGuide(featured);
        setSecondaryGuides(secondary);
      }
    } catch (error) {
      console.error("Error fetching guides:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="relative py-16 md:py-24 bg-[hsl(30,50%,97%)] overflow-hidden">
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(24, 95%, 55%)" fillOpacity="0.15"/>
          </svg>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="text-center mb-10">
            <Skeleton className="h-12 w-64 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <Skeleton className="h-[450px] w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-7 space-y-4">
              <Skeleton className="h-36 w-full rounded-xl" />
              <Skeleton className="h-36 w-full rounded-xl" />
              <Skeleton className="h-36 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!featuredGuide && secondaryGuides.length === 0) return null;

  return (
    <section id="guides" className="relative py-16 md:py-24 bg-[hsl(30,50%,97%)] overflow-hidden">
      {/* Wave decoration at bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(24, 95%, 55%)" fillOpacity="0.2"/>
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header - Orange badge style like Aides section */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-white shadow-lg border border-[hsl(24,95%,55%)]/20 mb-5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[hsl(24,95%,55%)]/10 border border-[hsl(24,95%,55%)]/30">
              <BookOpen className="w-5 h-5 text-[hsl(24,95%,55%)]" />
            </div>
            <span className="text-xl md:text-2xl font-bold text-[hsl(24,95%,55%)]">
              Guides par projet
            </span>
          </div>
          <p className="text-muted-foreground text-base md:text-lg whitespace-nowrap">
            Des guides complets pour réussir votre projet d'énergies renouvelables, étape par étape.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Featured Guide - Left Column */}
          {featuredGuide && (
            <div className="lg:col-span-5">
              <Link to={`/guide/${featuredGuide.slug}`} className="group block h-full">
                <article className="relative h-full bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-border/50 hover:border-[hsl(24,95%,55%)]/30">
                  {/* Image */}
                  <div className="relative h-56 md:h-64 overflow-hidden">
                    {featuredGuide.featured_image ? (
                      <img
                        src={featuredGuide.featured_image}
                        alt={featuredGuide.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[hsl(24,95%,55%)]/10 to-[hsl(24,95%,55%)]/5 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-[hsl(24,95%,55%)]/30" />
                      </div>
                    )}
                    
                    {/* Badge Guide 2025 */}
                    <div className="absolute top-4 right-4 z-20">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-[hsl(24,95%,55%)] text-white shadow-lg">
                        Guide 2025
                      </span>
                    </div>
                  </div>

                  {/* Content below image */}
                  <div className="p-5 md:p-6">
                    {/* Category */}
                    {featuredGuide.categories && featuredGuide.categories.length > 0 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[hsl(24,95%,55%)]/10 text-[hsl(24,95%,55%)] border border-[hsl(24,95%,55%)]/30 mb-3">
                        {featuredGuide.categories[0].name}
                      </span>
                    )}
                    
                    <h3 className="text-lg md:text-xl font-bold text-foreground mb-3 leading-tight group-hover:text-[hsl(24,95%,55%)] transition-colors line-clamp-2">
                      {featuredGuide.title}
                    </h3>
                    
                    {featuredGuide.excerpt && (
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-4 leading-relaxed">
                        {featuredGuide.excerpt}
                      </p>
                    )}
                    
                    <Button 
                      className="bg-[hsl(24,95%,55%)] hover:bg-[hsl(24,95%,50%)] text-white font-semibold px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 w-fit"
                    >
                      Lire le guide
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </article>
              </Link>
            </div>
          )}

          {/* Secondary Guides - Right Column */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="space-y-4 flex-1">
              {secondaryGuides.map((guide) => (
                <Link 
                  key={guide.id} 
                  to={`/guide/${guide.slug}`} 
                  className="group block"
                >
                  <article className="flex gap-5 p-5 bg-card rounded-xl border border-border/50 hover:border-[hsl(24,95%,55%)]/30 hover:shadow-lg transition-all duration-300">
                    {/* Thumbnail */}
                    <div className="relative w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-lg overflow-hidden">
                      {guide.featured_image ? (
                        <img
                          src={guide.featured_image}
                          alt={guide.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[hsl(24,95%,55%)]/10 to-[hsl(24,95%,55%)]/5 flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-[hsl(24,95%,55%)]/30" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="font-bold text-foreground text-base md:text-lg leading-snug line-clamp-2 group-hover:text-[hsl(24,95%,55%)] transition-colors mb-2">
                        {guide.title}
                      </h4>

                      {guide.excerpt && (
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-3 leading-relaxed">
                          {guide.excerpt}
                        </p>
                      )}

                      <span className="inline-flex items-center gap-1.5 text-[hsl(24,95%,55%)] font-semibold text-sm group-hover:gap-2.5 transition-all duration-300">
                        Lire le guide
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* View All Link */}
            <div className="mt-8 text-center">
              <Link 
                to="/guides" 
                className="inline-flex items-center gap-3 text-[hsl(24,95%,55%)] font-bold text-lg md:text-xl hover:gap-4 transition-all duration-300 group"
              >
                Voir tous les guides
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GuidesSection;
