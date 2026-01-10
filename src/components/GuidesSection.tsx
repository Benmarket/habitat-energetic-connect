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
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-5 w-full max-w-lg" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7">
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
            <div className="lg:col-span-5 space-y-4">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!featuredGuide && secondaryGuides.length === 0) return null;

  return (
    <section id="guides" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-10 md:mb-14">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider mb-3 block">
            Guides & Ressources
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
            Nos guides pratiques
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
            Des ressources complètes pour vous accompagner dans vos projets de rénovation énergétique et d'installation d'énergies renouvelables.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Featured Guide - Left Column */}
          {featuredGuide && (
            <div className="lg:col-span-7">
              <Link to={`/guide/${featuredGuide.slug}`} className="group block h-full">
                <article className="relative h-full bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-border/50 hover:border-primary/20">
                  {/* Image */}
                  <div className="relative h-64 md:h-80 lg:h-[400px] overflow-hidden">
                    {featuredGuide.featured_image ? (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
                        <img
                          src={featuredGuide.featured_image}
                          alt={featuredGuide.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <BookOpen className="w-20 h-20 text-primary/30" />
                      </div>
                    )}
                    
                    {/* Category Badge */}
                    {featuredGuide.categories && featuredGuide.categories.length > 0 && (
                      <div className="absolute top-4 left-4 z-20">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground shadow-lg">
                          {featuredGuide.categories[0].name}
                        </span>
                      </div>
                    )}

                    {/* Content overlay on image */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-3 leading-tight group-hover:text-primary-foreground transition-colors line-clamp-2">
                        {featuredGuide.title}
                      </h3>
                      {featuredGuide.excerpt && (
                        <p className="text-white/80 text-sm md:text-base line-clamp-2 mb-4 leading-relaxed">
                          {featuredGuide.excerpt}
                        </p>
                      )}
                      <Button 
                        variant="secondary" 
                        className="bg-white/95 hover:bg-white text-foreground font-semibold shadow-lg group-hover:shadow-xl transition-all duration-300"
                      >
                        Lire le guide
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </article>
              </Link>
            </div>
          )}

          {/* Secondary Guides - Right Column */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="space-y-4 flex-1">
              {secondaryGuides.map((guide) => (
                <Link 
                  key={guide.id} 
                  to={`/guide/${guide.slug}`} 
                  className="group block"
                >
                  <article className="flex gap-4 p-4 bg-card rounded-xl border border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                    {/* Thumbnail */}
                    <div className="relative w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-lg overflow-hidden">
                      {guide.featured_image ? (
                        <img
                          src={guide.featured_image}
                          alt={guide.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-primary/30" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      {/* Category */}
                      {guide.categories && guide.categories.length > 0 && (
                        <span className="text-xs font-semibold text-primary mb-1.5">
                          {guide.categories[0].name}
                        </span>
                      )}
                      
                      {/* Title */}
                      <h4 className="font-semibold text-foreground text-sm md:text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {guide.title}
                      </h4>

                      {/* Date */}
                      {guide.published_at && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {format(new Date(guide.published_at), "d MMMM yyyy", { locale: fr })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center flex-shrink-0">
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* View All Link */}
            <div className="mt-6 pt-4 border-t border-border/50">
              <Link 
                to="/guides" 
                className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all duration-200 group"
              >
                Voir tous les guides
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GuidesSection;
