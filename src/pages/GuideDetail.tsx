import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PaywallOverlay } from "@/components/PaywallOverlay";
import { GuideTemplateClassique } from "@/components/templates/GuideTemplateClassique";
import { GuideTemplatePremium } from "@/components/templates/GuideTemplatePremium";
import { GuideTemplateExpert } from "@/components/templates/GuideTemplateExpert";
import { calculateReadingTime } from "@/utils/readingTime";
import { extractTableOfContents, addHeadingIds } from "@/utils/tableOfContents";

interface Guide {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  published_at: string | null;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  content_type: string;
  status: string;
  tldr: string | null;
  faq: Array<{ question: string; answer: string }> | null;
  is_members_only: boolean;
  guide_template: string | null;
  is_downloadable: boolean;
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

const GuideDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentWithIds, setContentWithIds] = useState("");
  const [toc, setToc] = useState<Array<{ id: string; text: string; level: number }>>([]);
  const [readingTime, setReadingTime] = useState(0);

  useEffect(() => {
    fetchGuide();
  }, [slug]);

  const fetchGuide = async () => {
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
        .eq("content_type", "guide")
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setGuide({
          ...data,
          faq: (Array.isArray(data.faq) ? data.faq : []) as Array<{ question: string; answer: string }>,
          is_members_only: data.is_members_only ?? false,
          guide_template: data.guide_template ?? 'classique',
          is_downloadable: data.is_downloadable ?? true,
        });
        
        if (data.content) {
          setReadingTime(calculateReadingTime(data.content));
          const contentWithHeadingIds = addHeadingIds(data.content);
          setContentWithIds(contentWithHeadingIds);
          setToc(extractTableOfContents(contentWithHeadingIds));
        }
      }
    } catch (error) {
      console.error("Error fetching guide:", error);
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

  if (!guide) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-4 py-12 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Guide non trouvé</h1>
            <Link to="/guides">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Retour aux guides
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (guide.status !== "published") {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background pt-20">
          <div className="container mx-auto px-4 py-12 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Ce guide n'est pas disponible pour le moment
            </h1>
            <Link to="/guides">
              <Button variant="default" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Retour aux guides
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Determine if paywall should be shown
  const isPaywalled = guide.is_members_only && !user;
  const currentUrl = `https://prime-energies.fr/guide/${guide.slug}`;
  
  const breadcrumbItems = [
    { name: "Accueil", url: "https://prime-energies.fr" },
    { name: "Guides", url: "/guides" },
    { name: guide.title, url: currentUrl },
  ];

  // Schema.org structured data
  const articleSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.meta_title || guide.title,
    description: guide.meta_description || guide.excerpt || "",
    image: guide.featured_image ? [guide.featured_image] : [],
    datePublished: guide.published_at,
    dateModified: guide.updated_at || guide.published_at,
    author: {
      "@type": "Organization",
      name: "Prime Énergies",
      url: "https://prime-energies.fr"
    },
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
    }
  });

  const faqSchema = guide.faq && guide.faq.length > 0 ? JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faq.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  }) : null;

  // Prepare guide data for templates
  const guideData = {
    ...guide,
    excerpt: guide.excerpt || undefined,
    featured_image: guide.featured_image || undefined,
    published_at: guide.published_at || undefined,
    tldr: guide.tldr || undefined,
    faq: guide.faq || undefined,
  };

  // Render appropriate template
  const renderTemplate = () => {
    const templateProps = {
      guide: guideData,
      contentWithIds,
      toc,
      readingTime,
      isPaywalled,
      children: isPaywalled ? <PaywallOverlay percentRemaining={70} /> : undefined,
    };

    switch (guide.guide_template) {
      case 'premium':
        return <GuideTemplatePremium {...templateProps} />;
      case 'expert':
        return <GuideTemplateExpert {...templateProps} />;
      case 'classique':
      default:
        return <GuideTemplateClassique {...templateProps} />;
    }
  };

  return (
    <>
      <Helmet>
        <title>{guide.meta_title || guide.title}</title>
        <meta name="description" content={guide.meta_description || guide.excerpt || ""} />
        <link rel="canonical" href={currentUrl} />
        
        <meta property="og:type" content="article" />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:title" content={guide.meta_title || guide.title} />
        <meta property="og:description" content={guide.meta_description || guide.excerpt || ""} />
        <meta property="og:site_name" content="Prime Énergies" />
        <meta property="og:locale" content="fr_FR" />
        {guide.featured_image && <meta property="og:image" content={guide.featured_image} />}
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={currentUrl} />
        <meta name="twitter:title" content={guide.meta_title || guide.title} />
        <meta name="twitter:description" content={guide.meta_description || guide.excerpt || ""} />
        {guide.featured_image && <meta name="twitter:image" content={guide.featured_image} />}
      </Helmet>

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
        
        {renderTemplate()}
      </div>
      
      <Footer />
    </>
  );
};

export default GuideDetail;
