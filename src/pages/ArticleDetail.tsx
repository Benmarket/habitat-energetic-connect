import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, ArrowLeft, Tag, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ArticleSchema } from "@/components/SEO/ArticleSchema";
import { OrganizationSchema } from "@/components/SEO/OrganizationSchema";
import { TableOfContents } from "@/components/TableOfContents";
import { calculateReadingTime, formatReadingTime } from "@/utils/readingTime";
import { extractTableOfContents, addHeadingIds } from "@/utils/tableOfContents";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  published_at: string;
  updated_at: string;
  meta_title: string;
  meta_description: string;
  content_type: string;
  status: string;
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
  const [contentWithIds, setContentWithIds] = useState("");
  const [toc, setToc] = useState<Array<{ id: string; text: string; level: number }>>([]);
  const [readingTime, setReadingTime] = useState(0);

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
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setArticle(data);
        
        // Calculate reading time and extract TOC
        if (data.content) {
          setReadingTime(calculateReadingTime(data.content));
          const contentWithHeadingIds = addHeadingIds(data.content);
          setContentWithIds(contentWithHeadingIds);
          setToc(extractTableOfContents(contentWithHeadingIds));
        }
      }
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
            <h1 className="text-3xl font-bold text-foreground mb-4">Contenu non trouvé</h1>
            <div className="flex gap-4 justify-center">
              <Link to="/actualites">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Actualités
                </Button>
              </Link>
              <Link to="/aides">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Aides
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (article.status !== "published") {
    const backLink = article.content_type === "aide" ? "/aides" : "/actualites";
    const backText = article.content_type === "aide" ? "aides" : "actualités";
    
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-4 py-12 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Ce contenu n'est plus disponible pour le moment
            </h1>
            <p className="text-muted-foreground mb-6">
              Le contenu que vous recherchez n'est temporairement pas accessible.
            </p>
            <Link to={backLink}>
              <Button variant="default" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Retour aux {backText}
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const category = article.post_categories?.[0]?.categories;
  const basePath = article.content_type === "actualite" ? "actualites" : article.content_type === "guide" ? "guides" : "aides";
  const currentUrl = `https://prime-energies.fr/${basePath}/${article.slug}`;
  
  const breadcrumbItems = [
    {
      name: article.content_type === "aide" ? "Aides" : article.content_type === "guide" ? "Guides" : "Actualités",
      url: `/${basePath}`,
    },
    {
      name: article.title,
      url: currentUrl,
    },
  ];

  return (
    <>
      <OrganizationSchema />
      <ArticleSchema
        title={article.meta_title || article.title}
        description={article.meta_description || article.excerpt || ""}
        imageUrl={article.featured_image}
        publishedDate={article.published_at || undefined}
        modifiedDate={article.updated_at}
        categories={article.post_categories?.map((pc) => pc.categories.name) || []}
        url={currentUrl}
      />
      <Helmet>
        <title>{article.meta_title || article.title}</title>
        <meta
          name="description"
          content={article.meta_description || article.excerpt}
        />
        <link rel="canonical" href={currentUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content={article.meta_title || article.title} />
        <meta
          property="og:description"
          content={article.meta_description || article.excerpt}
        />
        <meta property="og:site_name" content="Prime Énergies" />
        <meta property="og:locale" content="fr_FR" />
        {article.featured_image && (
          <>
            <meta property="og:image" content={article.featured_image} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
          </>
        )}
        {article.published_at && (
          <meta property="article:published_time" content={article.published_at} />
        )}
        {article.updated_at && (
          <meta property="article:modified_time" content={article.updated_at} />
        )}
        {category && (
          <meta property="article:section" content={category.name} />
        )}
        {article.post_tags?.map((pt) => (
          <meta key={pt.tags.id} property="article:tag" content={pt.tags.name} />
        ))}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={currentUrl} />
        <meta name="twitter:title" content={article.meta_title || article.title} />
        <meta
          name="twitter:description"
          content={article.meta_description || article.excerpt}
        />
        {article.featured_image && (
          <meta name="twitter:image" content={article.featured_image} />
        )}
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <Breadcrumb items={breadcrumbItems} />
        
        <main className="pt-20">
          {/* Hero Section */}
          {article.featured_image ? (
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
                    <Link to={`/${basePath}?category=${category.slug}`} className="inline-block mb-4 mt-2">
                      <Badge variant="secondary" className="bg-primary text-primary-foreground rounded-full px-4 py-1 cursor-pointer hover:bg-primary/90 transition-colors">
                        {category.name}
                      </Badge>
                    </Link>
                  )}
                  <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 max-w-4xl">
                    {article.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                    {article.published_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(article.published_at), "d MMMM yyyy", { locale: fr })}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatReadingTime(readingTime)}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="bg-muted py-16">
              <div className="container mx-auto px-4">
                <Link 
                  to={`/${basePath}`}
                  className="inline-flex items-center gap-2 text-foreground hover:text-primary mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour aux {basePath}
                </Link>
                {category && (
                  <Link to={`/${basePath}?category=${category.slug}`} className="inline-block mb-4">
                    <Badge variant="secondary" className="bg-primary text-primary-foreground rounded-full px-4 py-1 cursor-pointer hover:bg-primary/90 transition-colors">
                      {category.name}
                    </Badge>
                  </Link>
                )}
                <h1 className="text-3xl lg:text-5xl font-bold text-foreground mb-4 max-w-4xl">
                  {article.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                  {article.published_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(article.published_at), "d MMMM yyyy", { locale: fr })}
                    </div>
                  )}
                  {article.updated_at && article.updated_at !== article.published_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Mis à jour le {format(new Date(article.updated_at), "d MMMM yyyy", { locale: fr })}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatReadingTime(readingTime)}
                  </div>
                </div>
              </div>
            </section>
          )}

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

              {/* Table of contents */}
              {toc.length > 0 && <TableOfContents items={toc} />}
              
              <div 
                className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-a:text-primary prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl"
                dangerouslySetInnerHTML={{ __html: contentWithIds }}
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
