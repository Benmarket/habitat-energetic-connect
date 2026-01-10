import { ReactNode, useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, Tag, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useActiveSection } from "@/hooks/useActiveSection";
import { transformCtaBannersInHtml } from "@/utils/contentRenderer";

interface GuideTemplateClassiqueProps {
  guide: {
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    featured_image?: string;
    published_at?: string;
    updated_at?: string;
    tldr?: string;
    faq?: Array<{ question: string; answer: string }>;
    post_categories?: Array<{ categories: { id: string; name: string; slug: string } }>;
    post_tags?: Array<{ tags: { id: string; name: string; slug: string } }>;
  };
  contentWithIds: string;
  toc: Array<{ id: string; text: string; level: number }>;
  readingTime: number;
  children?: ReactNode;
  isPaywalled?: boolean;
}

export const GuideTemplateClassique = ({
  guide,
  contentWithIds,
  toc,
  readingTime,
  children,
  isPaywalled = false,
}: GuideTemplateClassiqueProps) => {
  const category = guide.post_categories?.[0]?.categories;
  const { activeId, scrollProgress, scrollToSection } = useActiveSection(toc);
  const [heroOffset, setHeroOffset] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  
  // Transformer les bandeaux CTA pour le rendu
  const transformedContent = useMemo(() => transformCtaBannersInHtml(contentWithIds), [contentWithIds]);

  // Parallax effect for hero
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrollY = window.scrollY;
        setHeroOffset(scrollY * 0.4);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="pt-20 bg-gradient-to-b from-slate-50 to-white min-h-screen">
      {/* Progress bar */}
      <div className="fixed top-20 left-0 right-0 h-1 bg-slate-200 z-40">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Hero Section with Parallax */}
      {guide.featured_image ? (
        <section ref={heroRef} className="relative h-[450px] lg:h-[550px] overflow-hidden">
          <div 
            className="absolute inset-0 scale-110"
            style={{ transform: `translateY(${heroOffset}px)` }}
          >
            <img
              src={guide.featured_image}
              alt={guide.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          
          {/* Decorative shapes */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" className="w-full h-auto">
              <path 
                fill="#f8fafc" 
                d="M0,64 C480,120 960,0 1440,64 L1440,120 L0,120 Z"
              />
            </svg>
          </div>

          <div className="absolute inset-0 z-20 flex items-end pb-20">
            <div className="container mx-auto px-4">
              <Link 
                to="/guides"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-all hover:-translate-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour aux guides
              </Link>
              {category && (
                <Badge className="mb-4 bg-blue-500/90 text-white border-0 px-4 py-1.5">
                  {category.name}
                </Badge>
              )}
              <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 max-w-4xl leading-tight animate-fade-in">
                {guide.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                {guide.published_at && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(guide.published_at), "d MMMM yyyy", { locale: fr })}
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Clock className="w-4 h-4" />
                  {readingTime} min de lecture
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-gradient-to-br from-blue-600 to-indigo-700 py-20 relative overflow-hidden">
          {/* Abstract shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl" />
          
          <div className="container mx-auto px-4 relative z-10">
            <Link 
              to="/guides"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux guides
            </Link>
            {category && (
              <Badge className="mb-4 bg-white/20 text-white border-white/30">
                {category.name}
              </Badge>
            )}
            <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 max-w-4xl">
              {guide.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
              {guide.published_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(guide.published_at), "d MMMM yyyy", { locale: fr })}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {readingTime} min de lecture
              </div>
            </div>
          </div>
          
          {/* Bottom wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" className="w-full h-auto">
              <path fill="#f8fafc" d="M0,40 Q360,80 720,40 T1440,40 L1440,80 L0,80 Z"/>
            </svg>
          </div>
        </section>
      )}

      {/* Content Layout - Reversed: TOC on left, content on right */}
      <article className="py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Espace réservé pour le sommaire sticky global */}
            <aside className="hidden lg:block w-72 flex-shrink-0 order-1">
              {/* L'espace est réservé pour le composant GuideStickyNav qui apparaît au scroll */}
            </aside>

            {/* Main Content - RIGHT */}
            <div className="flex-1 max-w-3xl order-2">
              {/* Tags with reveal animation */}
              {guide.post_tags && guide.post_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8 animate-fade-in">
                  {guide.post_tags.map((pt) => (
                    <Badge 
                      key={pt.tags.id}
                      variant="secondary"
                      className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 transition-all hover:scale-105 px-3 py-1.5 flex items-center gap-1.5"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {pt.tags.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Excerpt with left border accent */}
              {guide.excerpt && (
                <div className="relative mb-10 pl-6 animate-fade-in">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
                  <p className="text-xl text-slate-600 leading-relaxed italic">
                    {guide.excerpt}
                  </p>
                </div>
              )}

              {/* TL;DR Card */}
              {guide.tldr && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 mb-10 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📌</span>
                    <h3 className="font-semibold text-blue-900">En résumé</h3>
                  </div>
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed">{guide.tldr}</p>
                </div>
              )}

              {/* Content */}
              <div className={`relative ${isPaywalled ? 'max-h-[600px] overflow-hidden' : ''}`}>
                <div
                  className="prose prose-lg max-w-none prose-slate
                    prose-headings:font-bold prose-headings:text-slate-900
                    prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:scroll-mt-28
                    prose-p:leading-relaxed
                    prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-slate-900
                    prose-li:marker:text-blue-500
                    prose-img:rounded-xl prose-img:shadow-lg"
                  dangerouslySetInnerHTML={{ __html: transformedContent }}
                />
                
                {isPaywalled && children}
              </div>

              {/* FAQ Section */}
              {!isPaywalled && guide.faq && guide.faq.length > 0 && (
                <div className="mt-16 pt-10 border-t border-slate-200">
                  <h2 className="text-2xl font-bold mb-8 text-slate-900">Questions fréquentes</h2>
                  <div className="space-y-4">
                    {guide.faq.map((item, index) => (
                      <div 
                        key={index} 
                        className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <h3 className="font-semibold text-lg mb-3 text-slate-900">{item.question}</h3>
                        <p className="text-slate-600 leading-relaxed">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </main>
  );
};
