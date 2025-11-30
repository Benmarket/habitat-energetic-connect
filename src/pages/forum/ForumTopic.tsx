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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Clock, CheckCircle, MessageSquare } from "lucide-react";

interface Post {
  id: string;
  content: string;
  is_solution: boolean;
  created_at: string;
  author: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    account_type: string | null;
  } | null;
}

interface Topic {
  title: string;
  created_at: string;
  views: number;
  is_locked: boolean;
  author: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    account_type: string | null;
  } | null;
  category: {
    name: string;
    slug: string;
    color: string | null;
  };
}

const ForumTopic = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchTopic();
      incrementViews();
    }
  }, [slug]);

  const incrementViews = async () => {
    const { data: topicData } = await supabase
      .from("forum_topics")
      .select("id, views")
      .eq("slug", slug)
      .single();

    if (topicData) {
      await supabase
        .from("forum_topics")
        .update({ views: topicData.views + 1 })
        .eq("id", topicData.id);
    }
  };

  const fetchTopic = async () => {
    try {
      const { data: topicData } = await supabase
        .from("forum_topics")
        .select(`
          id,
          title,
          created_at,
          views,
          is_locked,
          profiles!forum_topics_author_id_fkey (
            first_name,
            last_name,
            email,
            account_type
          ),
          forum_categories (
            name,
            slug,
            color
          )
        `)
        .eq("slug", slug)
        .single();

      if (!topicData) {
        setLoading(false);
        return;
      }

      setTopic({
        title: topicData.title,
        created_at: topicData.created_at,
        views: topicData.views,
        is_locked: topicData.is_locked,
        author: topicData.profiles as any,
        category: topicData.forum_categories as any,
      });

      // Fetch posts
      const { data: postsData } = await supabase
        .from("forum_posts")
        .select(`
          *,
          profiles!forum_posts_author_id_fkey (
            first_name,
            last_name,
            email,
            account_type
          )
        `)
        .eq("topic_id", topicData.id)
        .order("created_at", { ascending: true });

      if (postsData) {
        setPosts(
          postsData.map((post) => ({
            ...post,
            author: post.profiles as any,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching topic:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour répondre.",
        variant: "destructive",
      });
      return;
    }

    if (!replyContent.trim()) {
      toast({
        title: "Contenu manquant",
        description: "Veuillez saisir votre réponse.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: topicData } = await supabase
        .from("forum_topics")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!topicData) return;

      const { error } = await supabase.from("forum_posts").insert({
        topic_id: topicData.id,
        author_id: user.id,
        content: replyContent,
      });

      if (error) throw error;

      // Update topic updated_at
      await supabase
        .from("forum_topics")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", topicData.id);

      toast({
        title: "Réponse ajoutée",
        description: "Votre réponse a été publiée avec succès.",
      });

      setReplyContent("");
      fetchTopic();
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast({
        title: "Erreur",
        description: "Impossible de publier votre réponse.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getAuthorInitials = (author: Post["author"]) => {
    if (author?.first_name && author?.last_name) {
      return `${author.first_name[0]}${author.last_name[0]}`.toUpperCase();
    }
    return author?.email?.[0].toUpperCase() || "U";
  };

  const getAuthorName = (author: Post["author"]) => {
    if (author?.first_name && author?.last_name) {
      return `${author.first_name} ${author.last_name}`;
    }
    return author?.email?.split("@")[0] || "Utilisateur";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/3" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-12 text-center">
            <h1 className="text-2xl font-bold mb-4">Sujet introuvable</h1>
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
        <title>{topic.title} | Forums Prime Énergies</title>
        <meta name="description" content={topic.title} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="pt-20">
          <div className="container mx-auto px-4 py-12 max-w-4xl">
            {/* Breadcrumb */}
            <div className="mb-8 animate-fade-in">
              <Link to={`/forum/categorie/${topic.category.slug}`}>
                <Button variant="ghost" className="mb-4 -ml-4">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Retour à {topic.category.name}
                </Button>
              </Link>

              <h1 className="text-4xl font-bold mb-4">{topic.title}</h1>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDate(topic.created_at)}
                </span>
                <span>{topic.views} vues</span>
                <Badge
                  style={{
                    backgroundColor: `${topic.category.color}15`,
                    color: topic.category.color || "#10b981",
                    borderColor: `${topic.category.color}30`,
                  }}
                  className="border"
                >
                  {topic.category.name}
                </Badge>
              </div>
            </div>

            {/* First Post (Topic) */}
            <Card className="mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <Avatar className="w-12 h-12 flex-shrink-0">
                    <AvatarFallback
                      className="text-white font-semibold"
                      style={{ backgroundColor: topic.category.color || "#10b981" }}
                    >
                      {getAuthorInitials(topic.author)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{getAuthorName(topic.author)}</span>
                      {topic.author?.account_type && (
                        <Badge variant="outline" className="text-xs">
                          {topic.author.account_type}
                        </Badge>
                      )}
                    </div>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p>{posts[0]?.content || "Aucun contenu"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Replies */}
            {posts.slice(1).map((post, index) => (
              <Card
                key={post.id}
                className="mb-4 animate-fade-in"
                style={{ animationDelay: `${(index + 2) * 0.05}s` }}
              >
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarFallback
                        className="text-white font-semibold text-sm"
                        style={{ backgroundColor: topic.category.color || "#10b981" }}
                      >
                        {getAuthorInitials(post.author)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">{getAuthorName(post.author)}</span>
                        {post.author?.account_type && (
                          <Badge variant="outline" className="text-xs">
                            {post.author.account_type}
                          </Badge>
                        )}
                        {post.is_solution && (
                          <Badge className="bg-green-600 text-white text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Solution
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatDate(post.created_at)}
                        </span>
                      </div>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p>{post.content}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Reply Form */}
            {!topic.is_locked ? (
              <Card className="mt-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <CardContent className="p-6">
                  {user ? (
                    <form onSubmit={handleSubmitReply}>
                      <div className="flex items-start gap-4 mb-4">
                        <MessageSquare className="w-6 h-6 text-primary mt-1" />
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-3">Votre réponse</h3>
                          <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Écrivez votre réponse..."
                            rows={6}
                            className="mb-4"
                          />
                          <Button
                            type="submit"
                            disabled={submitting || !replyContent.trim()}
                            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                          >
                            {submitting ? "Publication..." : "Publier la réponse"}
                          </Button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        Vous devez être connecté pour répondre à ce sujet
                      </p>
                      <Button onClick={() => navigate("/connexion")}>Se connecter</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="mt-8">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">Ce sujet est verrouillé.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default ForumTopic;
