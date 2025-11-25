import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lightbulb, Calculator, Zap } from "lucide-react";

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
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Aides et Subventions 2024</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Découvrez toutes les aides disponibles pour financer votre projet d'énergies renouvelables
          </p>
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
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {aides.map((aide, index) => {
                const Icon = iconMap[index] || Lightbulb;
                const conditions = extractConditions(aide.content);
                const amount = extractAmount(aide.content);

                return (
                  <Card key={aide.id} className="hover:shadow-lg transition-shadow h-full flex flex-col border-blue-500/20">
                    <CardHeader className="flex-shrink-0">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-blue-500/10">
                          <Icon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2 line-clamp-2">{aide.title}</CardTitle>
                          {aide.categories && aide.categories.length > 0 && (
                            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-700 border-blue-500/30">
                              {aide.categories[0].name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription className="text-base line-clamp-3">
                        {aide.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-between">
                      <div>
                        <Badge variant="secondary" className="mb-3 text-sm px-4 py-2 bg-blue-500/10 text-blue-700 border-blue-500/20">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {amount}
                        </Badge>

                        {aide.tags && aide.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {aide.tags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                {tag.name}
                              </Badge>
                            ))}
                            {aide.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                                +{aide.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="space-y-2 mb-4">
                          <p className="text-sm font-semibold text-foreground">Conditions :</p>
                          {conditions.slice(0, 3).map((condition, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground line-clamp-2">{condition}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Link to={`/aide/${aide.slug}`} className="mt-auto">
                        <Button variant="outline" className="w-full border-blue-500/30 text-blue-700 hover:bg-blue-500/10">
                          En savoir plus
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {totalActiveAides > 3 && (
              <div className="text-center">
                <Link to="/aides">
                  <Button size="lg" className="gap-2">
                    Voir toutes les aides
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default AidesSection;
