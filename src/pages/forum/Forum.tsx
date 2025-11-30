import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Eye, Clock, Plus } from "lucide-react";
import * as Icons from "lucide-react";

interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  display_order: number;
  topicsCount: number;
  postsCount: number;
  lastActivity: string | null;
}

const Forum = () => {
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: categoriesData } = await supabase
        .from("forum_categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (!categoriesData) {
        setCategories([]);
        return;
      }

      // Fetch stats for each category
      const categoriesWithStats = await Promise.all(
        categoriesData.map(async (category) => {
          const { count: topicsCount } = await supabase
            .from("forum_topics")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id);

          const { data: lastTopic } = await supabase
            .from("forum_topics")
            .select("updated_at")
            .eq("category_id", category.id)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Count posts in this category's topics
          const { count: postsCount } = await supabase
            .from("forum_posts")
            .select("*, forum_topics!inner(category_id)", { count: "exact", head: true })
            .eq("forum_topics.category_id", category.id);

          return {
            ...category,
            topicsCount: topicsCount || 0,
            postsCount: postsCount || 0,
            lastActivity: lastTopic?.updated_at || null,
          };
        })
      );

      setCategories(categoriesWithStats);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string | null) => {
    if (!iconName) return MessageSquare;
    const Icon = (Icons as any)[iconName];
    return Icon || MessageSquare;
  };

  const formatLastActivity = (date: string | null) => {
    if (!date) return "Aucune activité";
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
  };

  return (
    <>
      <Helmet>
        <title>Forums de discussion | Prime Énergies</title>
        <meta
          name="description"
          content="Participez aux discussions sur les énergies renouvelables, posez vos questions et partagez votre expérience avec la communauté Prime Énergies."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20">
          <div className="container mx-auto px-4 py-12 max-w-6xl">
            {/* Header Section */}
            <div className="mb-12 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Forums de discussion
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Posez vos questions, partagez votre expérience et échangez avec la communauté
                  </p>
                </div>
                <Link to="/forum/nouveau-sujet">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Nouveau sujet
                  </Button>
                </Link>
              </div>
              <div className="h-1 w-24 bg-gradient-to-r from-primary to-purple-600 rounded-full"></div>
            </div>

            {/* Categories Grid */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                {categories.map((category, index) => {
                  const Icon = getIcon(category.icon);
                  return (
                    <Link key={category.id} to={`/forum/categorie/${category.slug}`}>
                      <Card
                        className="group hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 border-l-4 animate-fade-in"
                        style={{
                          borderLeftColor: category.color || "#10b981",
                          animationDelay: `${index * 0.1}s`,
                        }}
                      >
                        <CardHeader>
                          <div className="flex items-start gap-4">
                            <div
                              className="p-4 rounded-xl group-hover:scale-110 transition-transform duration-300 shadow-lg"
                              style={{
                                backgroundColor: `${category.color}15`,
                              }}
                            >
                              <Icon className="w-8 h-8" style={{ color: category.color || "#10b981" }} />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-2xl mb-2 group-hover:text-primary transition-colors">
                                {category.name}
                              </CardTitle>
                              <CardDescription className="text-base">
                                {category.description}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" />
                              <span className="font-medium">{category.topicsCount}</span>
                              <span>sujets</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4" />
                              <span className="font-medium">{category.postsCount}</span>
                              <span>messages</span>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                              <Clock className="w-4 h-4" />
                              <span>{formatLastActivity(category.lastActivity)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Forum Rules */}
            <Card className="mt-12 border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <CardHeader>
                <CardTitle className="text-amber-700 dark:text-amber-400">
                  Règles du forum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    <span>Soyez respectueux envers tous les membres de la communauté</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    <span>Postez dans la catégorie appropriée pour faciliter les recherches</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    <span>Utilisez des titres clairs et descriptifs pour vos sujets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    <span>Évitez le spam et les contenus publicitaires non sollicités</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Forum;
