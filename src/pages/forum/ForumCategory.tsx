import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Eye, ChevronLeft, Plus, Pin, Lock, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Topic {
  id: string;
  title: string;
  slug: string;
  author_id: string;
  views: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
  author: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    account_type: string | null;
  } | null;
  postsCount: number;
}

interface Category {
  name: string;
  description: string | null;
  color: string | null;
}

const ForumCategory = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchCategory();
      fetchTopics();
    }
  }, [slug]);

  const fetchCategory = async () => {
    const { data } = await supabase
      .from("forum_categories")
      .select("name, description, color")
      .eq("slug", slug)
      .single();

    if (data) setCategory(data);
  };

  const fetchTopics = async () => {
    try {
      const { data: categoryData } = await supabase
        .from("forum_categories")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!categoryData) return;

      const { data: topicsData } = await supabase
        .from("forum_topics")
        .select(`
          *,
          profiles!forum_topics_author_id_fkey (
            first_name,
            last_name,
            email,
            account_type
          )
        `)
        .eq("category_id", categoryData.id)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (!topicsData) {
        setTopics([]);
        return;
      }

      // Fetch post counts
      const topicsWithCounts = await Promise.all(
        topicsData.map(async (topic) => {
          const { count } = await supabase
            .from("forum_posts")
            .select("*", { count: "exact", head: true })
            .eq("topic_id", topic.id);

          return {
            ...topic,
            author: topic.profiles as any,
            postsCount: count || 0,
          };
        })
      );

      setTopics(topicsWithCounts);
    } catch (error) {
      console.error("Error fetching topics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAuthorInitials = (author: Topic["author"]) => {
    if (author?.first_name && author?.last_name) {
      return `${author.first_name[0]}${author.last_name[0]}`.toUpperCase();
    }
    return author?.email?.[0].toUpperCase() || "U";
  };

  const getAuthorName = (author: Topic["author"]) => {
    if (author?.first_name && author?.last_name) {
      return `${author.first_name} ${author.last_name}`;
    }
    return author?.email?.split("@")[0] || "Utilisateur";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
    return date.toLocaleDateString("fr-FR");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Catégorie introuvable</h1>
            <Link to="/forum">
              <Button>Retour au forum</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{category.name} | Forums Prime Énergies</title>
        <meta name="description" content={category.description || ""} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20">
          <div className="container mx-auto px-4 py-12 max-w-6xl">
            {/* Breadcrumb & Header */}
            <div className="mb-8 animate-fade-in">
              <Link to="/forum">
                <Button variant="ghost" className="mb-4 -ml-4">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Retour au forum
                </Button>
              </Link>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1
                    className="text-4xl font-bold mb-3"
                    style={{ color: category.color || undefined }}
                  >
                    {category.name}
                  </h1>
                  <p className="text-lg text-muted-foreground">{category.description}</p>
                </div>
                {user && (
                  <Button
                    onClick={() => navigate(`/forum/categorie/${slug}/nouveau`)}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Nouveau sujet
                  </Button>
                )}
              </div>
              <div
                className="h-1 w-24 rounded-full"
                style={{ backgroundColor: category.color || "#10b981" }}
              />
            </div>

            {/* Topics List */}
            <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              {topics.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground mb-4">
                      Aucun sujet dans cette catégorie pour le moment
                    </p>
                    {user && (
                      <Button onClick={() => navigate(`/forum/categorie/${slug}/nouveau`)}>
                        Créer le premier sujet
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                topics.map((topic) => (
                  <Link key={topic.id} to={`/forum/sujet/${topic.slug}`}>
                    <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-12 h-12 flex-shrink-0">
                            <AvatarFallback
                              className="text-white font-semibold"
                              style={{ backgroundColor: category.color || "#10b981" }}
                            >
                              {getAuthorInitials(topic.author)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {topic.is_pinned && (
                                <Pin className="w-4 h-4 text-amber-500 flex-shrink-0" />
                              )}
                              {topic.is_locked && (
                                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              )}
                              <h3 className="text-xl font-semibold group-hover:text-primary transition-colors truncate">
                                {topic.title}
                              </h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <span>
                                Par <span className="font-medium">{getAuthorName(topic.author)}</span>
                              </span>
                              {topic.author?.account_type && (
                                <Badge variant="outline" className="text-xs">
                                  {topic.author.account_type}
                                </Badge>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDate(topic.created_at)}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <MessageSquare className="w-4 h-4" />
                                <span className="font-medium">{topic.postsCount}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Eye className="w-4 h-4" />
                                <span className="font-medium">{topic.views}</span>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(topic.updated_at)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ForumCategory;
