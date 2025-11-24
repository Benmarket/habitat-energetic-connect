import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, ArrowLeft, Tag } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  published_at: string;
  meta_title: string;
  meta_description: string;
  content_type: string;
  post_categories: {
    categories: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  post_tags: {
    tags: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
}

const ArticleDetail = () => {
  const { categorySlug, slug } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [slug]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          *,
          post_categories(
            categories(id, name, slug)
          ),
          post_tags(
            tags(id, name, slug)
          )
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;
      if (data) setArticle(data);
    } catch (error) {
      console.error("Error fetching article:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!article) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-4 py-12 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Article non trouvé</h1>
            <Link to="/actualites" className="text-primary hover:underline">
              Retour aux actualités
            </Link>
          </div>
        </div>
      </>
    );
  }

  const category = article.post_categories?.[0]?.categories;
  const basePath = article.content_type === "actualite" ? "actualites" : article.content_type === "guide" ? "guides" : "aides";

  return (
    <>
      <Helmet>
        <title>{article.meta_title || article.title}</title>
        <meta 
          name="description" 
          content={article.meta_description || article.excerpt} 
        />
        <meta property="og:title" content={article.meta_title || article.title} />
        <meta property="og:description" content={article.meta_description || article.excerpt} />
        <meta property="og:image" content={article.featured_image} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={article.published_at} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-20">
          {/* Hero Section with Featured Image */}
          <section className="relative h-[400px] lg:h-[500px] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 z-10" />
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 z-20 flex items-end">
              <div className="container mx-auto px-4 pb-12">
                <Link 
                  to={`/${basePath}`}
                  className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour aux {basePath}
                </Link>
                {category && (
                  <Link to={`/actualites?category=${category.slug}`}>
                    <Badge variant="secondary" className="bg-primary text-primary-foreground mb-4 mt-2 rounded-full px-4 py-1 cursor-pointer hover:bg-primary/90 transition-colors">
                      {category.name}
                    </Badge>
                  </Link>
                )}
                <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 max-w-4xl">
                  {article.title}
                </h1>
                <div className="flex items-center text-white/90 text-sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  {format(new Date(article.published_at), "d MMMM yyyy", { locale: fr })}
                </div>
              </div>
            </div>
          </section>

          {/* Article Content */}
          <article className="py-12 lg:py-16">
            <div className="container mx-auto px-4 max-w-4xl">
              {/* Tags Section */}
              {article.post_tags && article.post_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {article.post_tags.map((pt) => (
                    <Badge 
                      key={pt.tags.id}
                      variant="secondary"
                      className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 transition-colors px-3 py-1.5 flex items-center gap-1.5"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {pt.tags.name}
                    </Badge>
                  ))}
                </div>
              )}
              
              {article.excerpt && (
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed border-l-4 border-primary pl-6">
                  {article.excerpt}
                </p>
              )}
              
              <div 
                className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-a:text-primary prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </div>
          </article>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ArticleDetail;
