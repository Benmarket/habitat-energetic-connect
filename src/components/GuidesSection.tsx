import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { BookOpen, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
        .order("published_at", { ascending: false })
        .limit(6);

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

  if (loading) {
    return (
      <section className="py-24 px-4 relative overflow-hidden bg-gradient-to-b from-background via-orange-50/30 to-background">
        <div className="absolute inset-0 opacity-20">
          <svg className="absolute bottom-0 w-full h-48" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="rgb(249, 115, 22)" fillOpacity="0.3" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,128C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-96 mx-auto mb-4" />
            <Skeleton className="h-6 w-full max-w-2xl mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  if (guides.length === 0) return null;

  return (
    <section className="py-12 md:py-16 lg:py-20 px-4 relative overflow-hidden bg-gradient-to-b from-background via-orange-50/30 to-background">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated orange gradient orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      {/* Wave decoration */}
      <div className="absolute inset-0 opacity-30">
        <svg className="absolute bottom-0 w-full h-48" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="rgb(249, 115, 22)" fillOpacity="0.4" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,128C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        <svg className="absolute top-0 w-full h-48 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="rgb(249, 115, 22)" fillOpacity="0.2" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,213.3C960,203,1056,181,1152,170.7C1248,160,1344,160,1392,160L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-8 md:mb-12 animate-fade-in flex flex-col items-center">
          <div className="inline-flex items-center gap-3 mb-4 bg-gradient-to-r from-orange-600/10 to-orange-500/10 px-8 py-4 rounded-full backdrop-blur-sm border-2 border-orange-500/30 shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 hover:scale-105">
            <div className="p-2 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 bg-clip-text text-transparent whitespace-nowrap">
              Guides par projet
            </h2>
          </div>
          <p className="text-muted-foreground text-xs md:text-sm max-w-2xl mx-auto mt-1 md:mt-1.5 leading-snug">
            Des guides complets pour réussir votre projet d'énergies renouvelables, étape par étape.
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-1 w-12 bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full"></div>
          </div>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
            slidesToScroll: 1,
          }}
          className="w-full mt-6"
        >
          <CarouselContent className="-ml-4">
            {guides.map((guide) => (
              <CarouselItem key={guide.id} className="pl-4 basis-full md:basis-1/3">
                <Link to={`/guide/${guide.slug}`} className="group block h-full">
                  <Card className="h-full transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20 hover:scale-105 hover:-translate-y-2 bg-card/80 backdrop-blur-sm border-2 border-orange-500/20 hover:border-orange-500 overflow-hidden">
                    {guide.featured_image && (
                      <div className="relative h-56 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-orange-950/20 to-transparent z-10" />
                        <img
                          src={guide.featured_image}
                          alt={guide.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute top-4 right-4 z-20">
                          <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-orange-500/30 backdrop-blur-sm border border-orange-400/20">
                            Guide 2025
                          </div>
                        </div>
                      </div>
                    )}
                    <CardHeader className="space-y-3">
                      {guide.categories && guide.categories.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {guide.categories.slice(0, 2).map((cat) => (
                            <span
                              key={cat.slug}
                              className="text-xs px-3 py-1.5 rounded-full bg-orange-600/10 text-orange-700 border border-orange-500/30 font-semibold hover:bg-orange-600/20 transition-colors"
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      )}
                      <CardTitle className="text-xl group-hover:text-orange-600 transition-colors duration-300 line-clamp-2 font-bold">
                        {guide.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-3 text-base leading-relaxed">
                        {guide.excerpt || "Découvrez ce guide complet pour optimiser votre projet énergétique..."}
                      </CardDescription>
                      <div className="mt-6 flex items-center gap-2 text-orange-600 font-bold group-hover:gap-4 transition-all duration-300">
                        <span>Lire le guide</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12 border-2 border-orange-500/30 hover:border-orange-600 hover:bg-orange-600 hover:text-white bg-background/80 backdrop-blur-sm shadow-lg hover:shadow-orange-500/30 transition-all duration-300" />
          <CarouselNext className="hidden md:flex -right-12 border-2 border-orange-500/30 hover:border-orange-600 hover:bg-orange-600 hover:text-white bg-background/80 backdrop-blur-sm shadow-lg hover:shadow-orange-500/30 transition-all duration-300" />
        </Carousel>

        {/* View All Button - Centered */}
        <div className="text-center mt-8 md:mt-12 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 hover:from-orange-700 hover:via-orange-600 hover:to-orange-700 text-white text-lg px-10 py-6 shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105 font-bold border border-orange-400/30"
          >
            <Link to="/guides">
              Voir tous les guides
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default GuidesSection;
