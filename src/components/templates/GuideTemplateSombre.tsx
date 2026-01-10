import { ReactNode, useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, BookOpen, List, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useActiveSection } from "@/hooks/useActiveSection";
import { transformCtaBannersInHtml } from "@/utils/contentRenderer";

interface TemplateColors {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
}

const DEFAULT_COLORS: TemplateColors = {
  primary: '#0f172a',
  secondary: '#1e293b',
  accent: '#22c55e',
  surface: '#020617',
};

interface GuideTemplateSombreProps {
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
    template_colors?: TemplateColors;
  };
  contentWithIds: string;
  toc: Array<{ id: string; text: string; level: number }>;
  readingTime: number;
  children?: ReactNode;
  isPaywalled?: boolean;
}

export const GuideTemplateSombre = ({
  guide,
  contentWithIds,
  toc,
  readingTime,
  children,
  isPaywalled = false,
}: GuideTemplateSombreProps) => {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const category = guide.post_categories?.[0]?.categories;
  const colors = guide.template_colors || DEFAULT_COLORS;
  const { activeId, scrollProgress, scrollToSection } = useActiveSection(toc);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Transformer les bandeaux CTA pour le rendu
  const transformedContent = useMemo(() => transformCtaBannersInHtml(contentWithIds), [contentWithIds]);

  // Floating geometric shapes animation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main className="pt-20 min-h-screen relative overflow-hidden" style={{ backgroundColor: colors.surface }}>
      {/* Animated background shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 rounded-full blur-[100px] opacity-20 transition-all duration-1000"
          style={{ 
            backgroundColor: colors.accent,
            left: mousePos.x * 0.02,
            top: mousePos.y * 0.02,
          }}
        />
        <div 
          className="absolute w-64 h-64 rounded-full blur-[80px] opacity-10 right-0 bottom-1/4 transition-all duration-1000"
          style={{ 
            backgroundColor: colors.accent,
            transform: `translate(${-mousePos.x * 0.01}px, ${-mousePos.y * 0.01}px)`
          }}
        />
        {/* Geometric grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(${colors.accent} 1px, transparent 1px), linear-gradient(90deg, ${colors.accent} 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Glowing progress bar */}
      <div className="fixed top-20 left-0 right-0 h-1 z-50" style={{ backgroundColor: colors.secondary }}>
        <div 
          className="h-full transition-all duration-100"
          style={{ 
            width: `${scrollProgress}%`,
            backgroundColor: colors.accent,
            boxShadow: `0 0 20px ${colors.accent}, 0 0 40px ${colors.accent}40`
          }}
        />
      </div>

      {/* Dark Header */}
      <section 
        className="py-20 lg:py-28 relative"
        style={{ backgroundColor: colors.primary }}
      >
        {/* Gradient overlay */}
        <div 
          className="absolute inset-0"
          style={{ 
            background: `radial-gradient(ellipse at top, ${colors.secondary} 0%, transparent 70%)`
          }}
        />
        
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <Link 
            to="/guides"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux guides
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
            <div className="flex-1">
              {category && (
                <div className="mb-6">
                  <span 
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider"
                    style={{ 
                      backgroundColor: `${colors.accent}20`,
                      color: colors.accent,
                      boxShadow: `0 0 20px ${colors.accent}30`
                    }}
                  >
                    <Zap className="w-4 h-4" />
                    {category.name}
                  </span>
                </div>
              )}
              
              <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-6">
                {guide.title}
              </h1>
              
              {guide.excerpt && (
                <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                  {guide.excerpt}
                </p>
              )}
            </div>

            {/* Stats Card with glow */}
            <div 
              className="flex-shrink-0 p-6 rounded-2xl border"
              style={{ 
                backgroundColor: colors.secondary,
                borderColor: `${colors.accent}30`,
                boxShadow: `0 0 40px ${colors.accent}10`
              }}
            >
              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold text-white">{readingTime}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">minutes</div>
                </div>
                <div>
                  <div className="text-4xl font-bold text-white">{toc.length}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">sections</div>
                </div>
              </div>
              {guide.published_at && (
                <div className="mt-6 pt-6 border-t border-gray-700 text-center">
                  <div className="text-xs text-gray-500">
                    {format(new Date(guide.published_at), "d MMMM yyyy", { locale: fr })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image with glow effect */}
      {guide.featured_image && (
        <div className="relative">
          <div className="absolute inset-0" style={{ 
            background: `linear-gradient(to bottom, ${colors.primary} 0%, transparent 20%, transparent 80%, ${colors.surface} 100%)`
          }} />
          <img
            src={guide.featured_image}
            alt={guide.title}
            className="w-full h-[350px] lg:h-[450px] object-cover"
          />
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 blur-3xl opacity-30"
            style={{ backgroundColor: colors.accent }}
          />
        </div>
      )}

      {/* Content */}
      <article className="py-16 lg:py-24 relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
            {/* Espace réservé pour le sommaire sticky global */}
            <aside className="lg:w-72 flex-shrink-0 order-2 lg:order-1">
              {/* L'espace est réservé pour le composant GuideStickyNav qui apparaît au scroll */}
            </aside>

            {/* Main Content */}
            <div className="flex-1 max-w-3xl order-1 lg:order-2">
              {/* Tags */}
              {guide.post_tags && guide.post_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-10">
                  {guide.post_tags.map((pt) => (
                    <span 
                      key={pt.tags.id}
                      className="text-xs font-semibold px-4 py-2 rounded-full border transition-colors hover:border-opacity-100"
                      style={{ 
                        borderColor: `${colors.accent}50`,
                        color: colors.accent
                      }}
                    >
                      {pt.tags.name}
                    </span>
                  ))}
                </div>
              )}

              {/* TL;DR with glow */}
              {guide.tldr && (
                <div 
                  className="p-8 rounded-2xl mb-12 border relative overflow-hidden"
                  style={{ 
                    backgroundColor: colors.secondary,
                    borderColor: `${colors.accent}30`
                  }}
                >
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
                    style={{ backgroundColor: colors.accent }}
                  />
                  <div className="relative z-10">
                    <div 
                      className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4"
                      style={{ color: colors.accent }}
                    >
                      <BookOpen className="w-4 h-4" />
                      Résumé exécutif
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      {guide.tldr}
                    </p>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className={`relative ${isPaywalled ? 'max-h-[600px] overflow-hidden' : ''}`}>
                <div
                  className="prose prose-lg prose-invert max-w-none
                    prose-headings:font-bold prose-headings:text-white
                    prose-h2:text-2xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:scroll-mt-28
                    prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-4
                    prose-p:leading-relaxed prose-p:text-gray-400
                    prose-a:font-semibold prose-a:no-underline prose-a:border-b-2 prose-a:pb-0.5
                    prose-strong:font-bold prose-strong:text-white
                    prose-ul:text-gray-400 prose-ol:text-gray-400
                    prose-li:my-1.5
                    prose-img:rounded-2xl prose-img:border prose-img:border-gray-800"
                  style={{
                    '--tw-prose-links': colors.accent,
                    '--tw-prose-bullets': colors.accent,
                  } as React.CSSProperties}
                  dangerouslySetInnerHTML={{ __html: transformedContent }}
                />
                
                {isPaywalled && children}
              </div>

              {/* FAQ Accordion with glow */}
              {!isPaywalled && guide.faq && guide.faq.length > 0 && (
                <div 
                  className="mt-20 p-8 rounded-2xl border"
                  style={{ 
                    backgroundColor: colors.secondary,
                    borderColor: `${colors.accent}20`
                  }}
                >
                  <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                    Questions fréquentes
                    <span 
                      className="text-sm font-normal px-3 py-1 rounded-full"
                      style={{ 
                        backgroundColor: colors.accent,
                        color: colors.primary 
                      }}
                    >
                      {guide.faq.length}
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {guide.faq.map((item, index) => (
                      <div 
                        key={index} 
                        className="rounded-xl overflow-hidden border transition-all"
                        style={{ 
                          backgroundColor: colors.primary,
                          borderColor: expandedFaq === index ? colors.accent : 'transparent',
                          boxShadow: expandedFaq === index ? `0 0 20px ${colors.accent}20` : 'none'
                        }}
                      >
                        <button
                          className="w-full p-5 text-left flex items-center justify-between"
                          onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        >
                          <span className="font-medium text-white pr-4">{item.question}</span>
                          {expandedFaq === index ? (
                            <ChevronUp className="w-5 h-5 flex-shrink-0" style={{ color: colors.accent }} />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                          )}
                        </button>
                        <div 
                          className={`overflow-hidden transition-all duration-300 ${
                            expandedFaq === index ? 'max-h-96' : 'max-h-0'
                          }`}
                        >
                          <div className="px-5 pb-5 text-gray-400 leading-relaxed">
                            {item.answer}
                          </div>
                        </div>
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
