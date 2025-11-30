import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lightbulb, Calculator, Zap, ArrowRight, Users } from "lucide-react";

interface Aide {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  content: string;
  categories?: { name: string }[];
  tags?: { name: string }[];
}

const iconMap: { [key: number]: any } = {
  0: Lightbulb,
  1: Calculator,
  2: Zap,
};

const AidesSection = () => {
  const [aides, setAides] = useState<Aide[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalActiveAides, setTotalActiveAides] = useState(0);

  useEffect(() => {
    fetchFeaturedAides();
  }, []);

  const fetchFeaturedAides = async () => {
    try {
      // Récupérer les IDs des aides mises en avant depuis site_settings
      const { data: settings } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "featured_aides")
        .maybeSingle();

      let featuredIds: string[] = [];
      if (settings?.value) {
        featuredIds = (settings.value as any).aide_ids || [];
      }

      // Compter toutes les aides publiées
      const { count } = await supabase
        .from("posts")
        .select("*", { count: 'exact', head: true })
        .eq("content_type", "aide")
        .eq("status", "published");

      setTotalActiveAides(count || 0);

      if (featuredIds.length === 0) {
        // Si aucune aide mise en avant, prendre les 3 premières publiées
        const { data } = await supabase
          .from("posts")
          .select(`
            id, 
            title, 
            excerpt, 
            slug, 
            content,
            post_categories(categories(name)),
            post_tags(tags(name))
          `)
          .eq("content_type", "aide")
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(3);

        if (data) {
          const formattedData = data.map((aide: any) => ({
            ...aide,
            categories: aide.post_categories?.map((pc: any) => pc.categories) || [],
            tags: aide.post_tags?.map((pt: any) => pt.tags) || [],
          }));
          setAides(formattedData);
        }
      } else {
        // Récupérer les aides mises en avant
        const { data } = await supabase
          .from("posts")
          .select(`
            id, 
            title, 
            excerpt, 
            slug, 
            content,
            post_categories(categories(name)),
            post_tags(tags(name))
          `)
          .eq("content_type", "aide")
          .eq("status", "published")
          .in("id", featuredIds)
          .limit(3);

        if (data) {
          const formattedData = data.map((aide: any) => ({
            ...aide,
            categories: aide.post_categories?.map((pc: any) => pc.categories) || [],
            tags: aide.post_tags?.map((pt: any) => pt.tags) || [],
          }));
          // Trier selon l'ordre des IDs
          const sortedData = featuredIds
            .map(id => formattedData.find(aide => aide.id === id))
            .filter(Boolean) as Aide[];
          setAides(sortedData);
        }
      }
    } catch (error) {
      console.error("Error fetching featured aides:", error);
    } finally {
      setLoading(false);
    }
  };

  // Extraire les conditions depuis le contenu HTML
  const extractConditions = (content: string): string[] => {
    const conditions: string[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const lists = doc.querySelectorAll('ul li, ol li');
    
    lists.forEach((item, index) => {
      if (index < 3) { // Max 3 conditions
        const text = item.textContent?.trim();
        if (text) conditions.push(text);
      }
    });
    
    return conditions.length > 0 ? conditions : ['Installation par un professionnel', 'Logement de plus de 2 ans', 'Équipements éligibles'];
  };

  // Extraire le montant depuis le contenu
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
    
    return "Montant variable selon conditions";
  };

  if (loading) return null;

  return (
    <section className="py-20 bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-blue-950/20 dark:via-background dark:to-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-14 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-4 bg-gradient-to-r from-blue-600/10 to-blue-500/10 px-6 py-3 rounded-full backdrop-blur-sm border border-blue-500/20 shadow-lg shadow-blue-500/10">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-md">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text text-transparent">
              Aides et Subventions 2024
            </h2>
          </div>
          <p className="text-sm md:text-base text-muted-foreground max-w-4xl mx-auto leading-snug">
            Découvrez toutes les aides disponibles pour financer votre projet d'énergies renouvelables
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-1 w-12 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full"></div>
          </div>
        </div>

        {aides.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-6">
              Aucune aide n'est disponible actuellement
            </p>
            {totalActiveAides > 0 && (
              <Link to="/aides">
                <Button size="lg" className="gap-2">
                  Voir toutes les aides ({totalActiveAides})
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              {aides.map((aide, index) => {
                const Icon = iconMap[index] || Lightbulb;
                const conditions = extractConditions(aide.content);
                const amount = extractAmount(aide.content);

                return (
                  <Card key={aide.id} className="group hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105 hover:-translate-y-1 h-full flex flex-col border-2 border-blue-500/20 hover:border-blue-500/40 overflow-hidden bg-card/80 backdrop-blur-sm min-h-[420px] max-h-[420px]">
                    <CardHeader className="flex-shrink-0 pb-3">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/20 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base md:text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors font-bold leading-tight">{aide.title}</CardTitle>
                          {aide.categories && aide.categories.length > 0 && (
                            <div className="mb-1.5">
                              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700 border-blue-500/30 font-semibold px-2 py-0.5">
                                {aide.categories[0].name}
                              </Badge>
                            </div>
                          )}
                          {aide.tags && aide.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {aide.tags.slice(0, 2).map((tag, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="outline" 
                                  className="text-[10px] rounded-full bg-muted/80 border-border text-foreground/80 px-1.5 py-0"
                                >
                                  {tag.name}
                                </Badge>
                              ))}
                              {aide.tags.length > 2 && (
                                <Badge 
                                  variant="outline" 
                                  className="text-[10px] rounded-full bg-muted/80 border-border text-foreground/80 px-1.5 py-0"
                                >
                                  +{aide.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-xs md:text-sm line-clamp-2 leading-snug">
                        {aide.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-between pt-2 pb-4">
                      <div>
                        <Badge variant="secondary" className="mb-2 text-xs px-3 py-1 bg-blue-500/10 text-blue-700 border-blue-500/20">
                          <CheckCircle2 className="w-3 h-3 mr-1.5" />
                          <span className="line-clamp-1">{amount}</span>
                        </Badge>

                        <div className="space-y-1.5 mb-3">
                          <p className="text-xs font-semibold text-foreground">Conditions :</p>
                          {conditions.slice(0, 2).map((condition, idx) => (
                            <div key={idx} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-muted-foreground line-clamp-1 leading-tight">{condition}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Link to={`/aide/${aide.slug}`} className="mt-auto">
                        <Button variant="outline" size="sm" className="w-full border-blue-500/30 text-blue-700 hover:bg-blue-600 hover:text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30 text-xs">
                          En savoir plus
                          <ArrowRight className="w-3 h-3 ml-2 inline group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {totalActiveAides > 3 && (
              <div className="text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <Button asChild variant="outline" size="lg" className="group border-2 border-blue-500/30 hover:border-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/30 font-semibold">
                  <Link to="/aides" className="flex items-center gap-2">
                    Voir toutes les aides ({totalActiveAides})
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            )}

            <div className="mt-14 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 rounded-3xl p-6 md:p-8 text-center border-2 border-blue-500/20 shadow-xl shadow-blue-500/10 backdrop-blur-sm animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg shadow-blue-500/30 mb-4">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Besoin d'aide pour constituer votre dossier ?
              </h3>
              <p className="text-muted-foreground text-sm md:text-base mb-5 max-w-4xl mx-auto leading-snug">
                Nos installateurs partenaires vous accompagnent dans toutes vos démarches administratives
              </p>
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 font-bold px-8">
                <Link to="/contact" className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Trouver un professionnel
                </Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default AidesSection;
