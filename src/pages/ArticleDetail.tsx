import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, ArrowLeft, Tag, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/Breadcrumb";
import { TableOfContents } from "@/components/TableOfContents";
import { RelatedArticles } from "@/components/RelatedArticles";
import { calculateReadingTime, formatReadingTime } from "@/utils/readingTime";
import { extractTableOfContents, addHeadingIds } from "@/utils/tableOfContents"; import { transformCtaBannersInHtml } from "@/utils/contentRenderer";
import type { Database } from "@/integrations/supabase/types";

type ContentType = Database["public"]["Enums"]["content_type"];

interface Author {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
}

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
  tldr: string | null;
  faq: Array<{ question: string; answer: string }> | null;
  focus_keywords: string[] | null;
  // Author fields
  hide_author: boolean;
  author_display_type: string | null;
  display_author_id: string | null;
  custom_author_name: string | null;
  author_id: string;
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
  const [authorInfo, setAuthorInfo] = useState<{ name: string; bio?: string | null; avatar?: string | null; jobTitle?: string | null } | null>(null);

  useEffect(() => {
    fetchArticle();
  }, [slug]);

  const fetchAuthorInfo = async (articleData: any) => {
    try {
      if (articleData.author_display_type === "user") {
        // Fetch user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name")
          .eq("id", articleData.author_id)
          .maybeSingle();
        
        if (profile) {
          const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
          setAuthorInfo({ name: fullName || "Auteur" });
        }
      } else if (articleData.author_display_type === "custom") {
        setAuthorInfo({ name: articleData.custom_author_name || "Auteur" });
      } else if (articleData.author_display_type === "author" && articleData.display_author_id) {
        // Fetch registered author
        const { data: author } = await supabase
          .from("authors")
          .select("name, bio, avatar_url, job_title")
          .eq("id", articleData.display_author_id)
          .maybeSingle();
        
        if (author) {
          setAuthorInfo({ name: author.name, bio: author.bio, avatar: author.avatar_url, jobTitle: author.job_title });
        }
      }
    } catch (error) {
      console.error("Error fetching author info:", error);
    }
  };

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
        setArticle({
          ...data,
          faq: (Array.isArray(data.faq) ? data.faq : []) as Array<{ question: string; answer: string }>
        });
        
        // Calculate reading time and extract TOC
        if (data.content) {
          setReadingTime(calculateReadingTime(data.content));
          // Strip duplicate summary-box and FAQ section from HTML (rendered separately as React components)
          let cleanedContent = data.content
            .replace(/<div class="summary-box"[^>]*>[\s\S]*?<\/div>/gi, '')
            .replace(/<h2[^>]*>Questions fréquentes<\/h2>[\s\S]*?(?=<h2|$)/gi, '');
          const contentWithHeadingIds = addHeadingIds(cleanedContent);
          setContentWithIds(contentWithHeadingIds);
          setToc(extractTableOfContents(contentWithHeadingIds));
        }

        // Fetch author info if not hidden
        if (!data.hide_author) {
          await fetchAuthorInfo(data);
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
      name: "Accueil",
      url: "/",
    },
    {
      name: article.content_type === "aide" ? "Aides" : article.content_type === "guide" ? "Guides" : "Actualités",
      url: `/${basePath}`,
    },
    {
      name: article.title,
      url: currentUrl,
    },
  ];

  // Prepare schemas as strings to avoid react-helmet issues with fragments
  const breadcrumbSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  });

  const organizationSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Prime Énergies",
    url: "https://prime-energies.fr",
    logo: "https://prime-energies.fr/logo.png",
    description: "Bénéficiez d'une étude énergétique gratuite et découvrez les travaux subventionnés adaptés à votre logement. Panneaux solaires, pompe à chaleur, isolation.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Service client",
      availableLanguage: ["French"]
    }
  });

  // Build author schema: use Person when individual author is set, Organization otherwise
  const authorSchema = authorInfo && !article.hide_author
    ? {
        "@type": "Person",
        name: authorInfo.name,
        ...(authorInfo.bio ? { description: authorInfo.bio } : {}),
        url: "https://prime-energies.fr"
      }
    : {
        "@type": "Organization",
        name: "Prime Énergies",
        url: "https://prime-energies.fr"
      };

  // Combine focus_keywords + category names + tag names for comprehensive keywords
  const allKeywords = [
    ...(article.focus_keywords || []),
    ...(article.post_categories?.map(pc => pc.categories.name) || []),
    ...(article.post_tags?.map(pt => pt.tags.name) || []),
  ].filter(Boolean);

  const articleSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.meta_title || article.title,
    description: article.meta_description || article.excerpt || "",
    image: article.featured_image ? [{
      "@type": "ImageObject",
      url: article.featured_image,
      width: 1200,
      height: 630
    }] : [],
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: authorSchema,
    publisher: {
      "@type": "Organization",
      name: "Prime Énergies",
      logo: {
        "@type": "ImageObject",
        url: "https://prime-energies.fr/logo.png"
      }
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": currentUrl
    },
    articleSection: article.post_categories?.[0]?.categories.name || "Énergies renouvelables",
    keywords: allKeywords.join(", "),
    inLanguage: "fr-FR",
    isAccessibleForFree: true,
    ...(article.tldr ? { abstract: article.tldr } : {})
  });

  // Schema FAQ si des questions FAQ existent
  const faqSchema = article.faq && article.faq.length > 0 ? JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faq.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  }) : null;

  return (
    <>
      <Helmet>
        <title>{article.meta_title || article.title}</title>
        <meta
          name="description"
          content={article.meta_description || article.excerpt}
        />
        <link rel="canonical" href={currentUrl} />
        
        <meta property="og:type" content="article" />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content={article.meta_title || article.title} />
        <meta
          property="og:description"
          content={article.meta_description || article.excerpt}
        />
        <meta property="og:site_name" content="Prime Énergies" />
        <meta property="og:locale" content="fr_FR" />
        {article.featured_image && <meta property="og:image" content={article.featured_image} />}
        {article.featured_image && <meta property="og:image:width" content="1200" />}
        {article.featured_image && <meta property="og:image:height" content="630" />}
        {article.published_at && <meta property="article:published_time" content={article.published_at} />}
        {article.updated_at && <meta property="article:modified_time" content={article.updated_at} />}
        {category && <meta property="article:section" content={category.name} />}
        {article.post_tags?.map((pt) => (
          <meta key={pt.tags.id} property="article:tag" content={pt.tags.name} />
        ))}
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={currentUrl} />
        <meta name="twitter:title" content={article.meta_title || article.title} />
        <meta
          name="twitter:description"
          content={article.meta_description || article.excerpt}
        />
        {article.featured_image && <meta name="twitter:image" content={article.featured_image} />}
      </Helmet>
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbSchema }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: organizationSchema }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: articleSchema }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: faqSchema }}
        />
      )}

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
                  <div className="flex items-center gap-4 mb-6">
                    <Link 
                      to={`/${basePath}`}
                      className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Retour aux {basePath}
                    </Link>
                    {category && (
                      <Link to={`/${basePath}?category=${category.slug}`}>
                        <Badge variant="secondary" className="bg-primary text-primary-foreground rounded-full px-4 py-1 cursor-pointer hover:bg-primary/90 transition-colors">
                          {category.name}
                        </Badge>
                      </Link>
                    )}
                  </div>
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
              </div>
            </section>
          ) : (
            <section className="bg-muted py-16">
              <div className="container mx-auto px-4">
                <div className="flex items-center gap-4 mb-6">
                  <Link 
                    to={`/${basePath}`}
                    className="inline-flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Retour aux {basePath}
                  </Link>
                  {category && (
                    <Link to={`/${basePath}?category=${category.slug}`}>
                      <Badge variant="secondary" className="bg-primary text-primary-foreground rounded-full px-4 py-1 cursor-pointer hover:bg-primary/90 transition-colors">
                        {category.name}
                      </Badge>
                    </Link>
                  )}
                </div>
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
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10 max-w-6xl mx-auto">
                {/* Main Content Column */}
                <div className="min-w-0">
                  {/* Author + Meta Bar */}
                  {authorInfo && (
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
                      {authorInfo.avatar ? (
                        <img
                          src={authorInfo.avatar}
                          alt={authorInfo.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{authorInfo.name}</p>
                        {authorInfo.jobTitle && (
                          <p className="text-sm text-primary/80 font-medium">{authorInfo.jobTitle}</p>
                        )}
                        {authorInfo.bio && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{authorInfo.bio}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {article.post_tags && article.post_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {article.post_tags.map((pt) => (
                        <Badge 
                          key={pt.tags.id}
                          variant="secondary"
                          className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 transition-colors px-3 py-1 text-xs font-medium flex items-center gap-1.5"
                        >
                          <Tag className="w-3 h-3" />
                          {pt.tags.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Lead / Excerpt */}
                  {article.excerpt && (
                    <p className="text-lg lg:text-xl text-muted-foreground mb-8 leading-relaxed font-light">
                      {article.excerpt}
                    </p>
                  )}

                  {/* TL;DR Section — only from structured data, skip if already in HTML */}
                  {article.tldr && (
                    <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 p-6 mb-10 rounded-xl">
                      <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                        📌 En résumé
                      </h2>
                      <div className="text-base text-muted-foreground space-y-1.5 whitespace-pre-line leading-relaxed">
                        {article.tldr}
                      </div>
                    </div>
                  )}

                  {/* Separator */}
                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-10" />

                  {/* Article Body */}
                  <div 
                    className="article-content prose prose-lg max-w-none
                      prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight
                      prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-5 prose-h2:pb-3 prose-h2:border-b prose-h2:border-border/50
                      prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
                      prose-p:text-foreground prose-p:leading-[1.8] prose-p:mb-5
                      prose-strong:text-foreground prose-strong:font-semibold
                      prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-li:leading-[1.8]
                      prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                      prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8
                      prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:rounded-r-lg
                    "
                    dangerouslySetInnerHTML={{ __html: transformCtaBannersInHtml(contentWithIds) }}
                  />

                  {/* FAQ Section */}
                  {article.faq && article.faq.length > 0 && (
                    <div className="mt-16 pt-10 border-t border-border">
                      <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">❓</span>
                        Questions fréquentes
                      </h2>
                      <div className="space-y-4">
                        {article.faq.map((item, index) => (
                          <details key={index} className="group bg-muted/30 rounded-xl border border-border/50 overflow-hidden">
                            <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-muted/50 transition-colors">
                              <h3 className="text-base font-semibold text-foreground pr-4">{item.question}</h3>
                              <ArrowLeft className="w-5 h-5 text-muted-foreground -rotate-90 group-open:rotate-90 transition-transform shrink-0" />
                            </summary>
                            <div className="px-5 pb-5 pt-0">
                              <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar — Table of Contents */}
                <aside className="hidden lg:block">
                  <div className="sticky top-28">
                    {toc.length > 0 && <TableOfContents items={toc} />}
                  </div>
                </aside>
              </div>
            </div>
          </article>
        </main>
        {article && (
          <RelatedArticles
            currentArticleId={article.id}
            categorySlug={article.post_categories?.[0]?.categories?.slug}
            contentType={article.content_type as ContentType}
          />
        )}
        <Footer />
      </div>
    </>
  );
};

export default ArticleDetail;
