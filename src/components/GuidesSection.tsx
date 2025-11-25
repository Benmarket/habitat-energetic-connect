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
      <section className="py-24 px-4 relative overflow-hidden bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="absolute inset-0 opacity-20">
          <svg className="absolute bottom-0 w-full h-48" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="hsl(var(--primary))" fillOpacity="0.3" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,128C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
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

  const slides = [];
  for (let i = 0; i < guides.length; i += 3) {
    slides.push(guides.slice(i, i + 3));
  }

  return (
    <section className="py-24 px-4 relative overflow-hidden bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Wave decoration */}
      <div className="absolute inset-0 opacity-20">
        <svg className="absolute bottom-0 w-full h-48" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="hsl(var(--primary))" fillOpacity="0.3" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,128C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        <svg className="absolute top-0 w-full h-48 rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="hsl(var(--primary))" fillOpacity="0.2" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,213.3C960,203,1056,181,1152,170.7C1248,160,1344,160,1392,160L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4 bg-primary/10 px-6 py-3 rounded-full backdrop-blur-sm border border-primary/20">
            <BookOpen className="w-6 h-6 text-primary" />
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Guides par projet
            </h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto mt-6">
            Des guides complets pour réussir votre projet d'énergies renouvelables, étape par étape.
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {slides.map((slideGuides, slideIndex) => (
              <CarouselItem key={slideIndex}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
                  {slideGuides.map((guide) => (
                    <Link key={guide.id} to={`/guide/${guide.slug}`} className="group">
                      <Card className="h-full transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 bg-card/80 backdrop-blur-sm border-2 border-primary/20 hover:border-primary overflow-hidden">
                        {guide.featured_image && (
                          <div className="relative h-56 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent z-10" />
                            <img
                              src={guide.featured_image}
                              alt={guide.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute top-4 right-4 z-20">
                              <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm">
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
                                  className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/30 font-medium"
                                >
                                  {cat.name}
                                </span>
                              ))}
                            </div>
                          )}
                          <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300 line-clamp-2">
                            {guide.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="line-clamp-3 text-base leading-relaxed">
                            {guide.excerpt || "Découvrez ce guide complet pour optimiser votre projet énergétique..."}
                          </CardDescription>
                          <div className="mt-6 flex items-center gap-2 text-primary font-semibold group-hover:gap-4 transition-all duration-300">
                            <span>Lire le guide</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12 border-2 border-primary/30 hover:border-primary bg-background/80 backdrop-blur-sm" />
          <CarouselNext className="hidden md:flex -right-12 border-2 border-primary/30 hover:border-primary bg-background/80 backdrop-blur-sm" />
        </Carousel>

        <div className="text-center mt-16">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-primary via-primary/90 to-primary hover:from-primary/90 hover:to-primary text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
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
