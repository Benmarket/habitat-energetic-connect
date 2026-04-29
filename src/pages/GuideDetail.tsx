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
import { GuideTemplateEpure } from "@/components/templates/GuideTemplateEpure";
import { GuideTemplateVibrant } from "@/components/templates/GuideTemplateVibrant";
import { GuideTemplateSombre } from "@/components/templates/GuideTemplateSombre";
import { GuideStickyNav } from "@/components/GuideStickyNav";
import { useActiveSection } from "@/hooks/useActiveSection";
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
  focus_keywords: string[] | null;
  is_members_only: boolean;
  guide_template: string | null;
  is_downloadable: boolean;
  topline: string | null;
  topline_bg_color: string | null;
  topline_text_color: string | null;
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

const GuideDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentWithIds, setContentWithIds] = useState("");
  const [toc, setToc] = useState<Array<{ id: string; text: string; level: number }>>([]);
  const [readingTime, setReadingTime] = useState(0);
  
  // Hook pour le sommaire sticky
  const { activeId, scrollToSection } = useActiveSection(toc);

  useEffect(() => {
    fetchGuide();
  }, [slug]);

  // Écoute "guide-unlocked" pour recharger après inscription via paywall
  useEffect(() => {
    const onUnlock = (e: any) => {
      if (e?.detail?.guideId && guide?.id === e.detail.guideId) {
        // Recharge pour bénéficier du contenu intégral
        window.location.reload();
      }
    };
    window.addEventListener("guide-unlocked", onUnlock as EventListener);
    return () => window.removeEventListener("guide-unlocked", onUnlock as EventListener);
  }, [guide?.id]);

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
          topline: data.topline ?? null,
          topline_bg_color: data.topline_bg_color ?? '#22c55e',
          topline_text_color: data.topline_text_color ?? '#ffffff',
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
    { name: "Accueil", url: "/" },
    { name: "Guides", url: "/guides" },
    { name: guide.title, url: currentUrl },
  ];

  // Build comprehensive keywords
  const allKeywords = [
    ...(guide.focus_keywords || []),
    ...(guide.post_categories?.map(pc => pc.categories.name) || []),
    ...(guide.post_tags?.map(pt => pt.tags.name) || []),
  ].filter(Boolean);

  // Schema.org structured data — TechArticle for guides
  const articleSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: guide.meta_title || guide.title,
    description: guide.meta_description || guide.excerpt || "",
    image: guide.featured_image ? [{
      "@type": "ImageObject",
      url: guide.featured_image,
      width: 1200,
      height: 630
    }] : [],
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
    },
    articleSection: guide.post_categories?.[0]?.categories?.name || "Guides pratiques",
    keywords: allKeywords.join(", "),
    inLanguage: "fr-FR",
    isAccessibleForFree: !guide.is_members_only,
    ...(guide.tldr ? { abstract: guide.tldr } : {})
  });

  // HowTo schema extracted from headings (each H2 = a step)
  const howToSteps = toc
    .filter(item => item.level === 2)
    .map((item, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: item.text,
      url: `${currentUrl}#${item.id}`
    }));

  const howToSchema = howToSteps.length >= 2 ? JSON.stringify({
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: guide.meta_title || guide.title,
    description: guide.meta_description || guide.excerpt || "",
    image: guide.featured_image || undefined,
    totalTime: `PT${readingTime}M`,
    step: howToSteps
  }) : null;

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
    topline: guide.topline || undefined,
    topline_bg_color: guide.topline_bg_color || '#22c55e',
    topline_text_color: guide.topline_text_color || '#ffffff',
  };

  // Render appropriate template
  const renderTemplate = () => {
    const templateProps = {
      guide: guideData,
      contentWithIds,
      toc,
      readingTime,
      isPaywalled,
      children: isPaywalled ? <PaywallOverlay percentRemaining={70} guide={{ id: guide.id, slug: guide.slug, title: guide.title }} /> : undefined,
    };

    switch (guide.guide_template) {
      case 'premium':
        return <GuideTemplatePremium {...templateProps} />;
      case 'expert':
        return <GuideTemplateExpert {...templateProps} />;
      case 'epure':
        return <GuideTemplateEpure {...templateProps} />;
      case 'vibrant':
        return <GuideTemplateVibrant {...templateProps} />;
      case 'sombre':
        return <GuideTemplateSombre {...templateProps} />;
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
        {guide.featured_image && <meta property="og:image:width" content="1200" />}
        {guide.featured_image && <meta property="og:image:height" content="630" />}
        {guide.published_at && <meta property="article:published_time" content={guide.published_at} />}
        {guide.updated_at && <meta property="article:modified_time" content={guide.updated_at} />}
        
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
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: howToSchema }}
        />
      )}
      <div className="min-h-screen bg-background">
        <Header />
        <Breadcrumb items={breadcrumbItems} />
        
        {/* Navigation sticky avec téléchargement + sommaire */}
        {!isPaywalled && (
          <GuideStickyNav
            guideTitle={guide.title}
            template={guide.guide_template || 'classique'}
            toc={toc}
            isDownloadable={guide.is_downloadable}
            activeId={activeId}
            onScrollToSection={scrollToSection}
          />
        )}
        
        {renderTemplate()}
      </div>
      
      <Footer />
    </>
  );
};

export default GuideDetail;
