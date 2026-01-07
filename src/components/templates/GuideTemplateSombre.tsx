import { ReactNode, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, Tag, BookOpen, List, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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
  surface: '#f1f5f9',
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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const category = guide.post_categories?.[0]?.categories;
  const colors = guide.template_colors || DEFAULT_COLORS;

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="pt-20 min-h-screen bg-white">
      {/* Progress Bar */}
      <div className="fixed top-20 left-0 right-0 h-1 z-50" style={{ backgroundColor: colors.secondary }}>
        <div 
          className="h-full transition-all duration-100"
          style={{ 
            width: `${scrollProgress}%`,
            backgroundColor: colors.accent
          }}
        />
      </div>

      {/* Dark Header */}
      <section 
        className="py-16 lg:py-24"
        style={{ backgroundColor: colors.primary }}
      >
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="flex-1">
              <Link 
                to="/guides"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour aux guides
              </Link>
              
              {category && (
                <div className="mb-4">
                  <span 
                    className="inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wider"
                    style={{ backgroundColor: colors.accent, color: colors.primary }}
                  >
                    {category.name}
                  </span>
                </div>
              )}
              
              <h1 className="text-3xl lg:text-5xl font-bold text-white leading-tight mb-4">
                {guide.title}
              </h1>
              
              {guide.excerpt && (
                <p className="text-lg text-gray-300 max-w-2xl">
                  {guide.excerpt}
                </p>
              )}
            </div>

            {/* Stats Card */}
            <div 
              className="flex-shrink-0 p-6 rounded-xl"
              style={{ backgroundColor: colors.secondary }}
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{readingTime}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">min</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{toc.length}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">sections</div>
                </div>
              </div>
              {guide.published_at && (
                <div className="mt-4 pt-4 border-t border-gray-700 text-center">
                  <div className="text-xs text-gray-400">
                    Publié le {format(new Date(guide.published_at), "d MMM yyyy", { locale: fr })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {guide.featured_image && (
        <div className="relative h-[300px] lg:h-[400px]">
          <img
            src={guide.featured_image}
            alt={guide.title}
            className="w-full h-full object-cover"
          />
          <div 
            className="absolute inset-0"
            style={{ 
              background: `linear-gradient(to bottom, ${colors.primary} 0%, transparent 30%, transparent 70%, white 100%)`
            }}
          />
        </div>
      )}

      {/* Content */}
      <article className="py-12 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
            {/* Sidebar TOC */}
            {toc.length > 0 && !isPaywalled && (
              <aside className="lg:w-64 flex-shrink-0 order-2 lg:order-1">
                <div className="sticky top-28">
                  <div 
                    className="p-6 rounded-xl border-l-4"
                    style={{ 
                      backgroundColor: colors.surface,
                      borderColor: colors.accent
                    }}
                  >
                    <div 
                      className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4"
                      style={{ color: colors.primary }}
                    >
                      <List className="w-4 h-4" />
                      Sommaire
                    </div>
                    <nav className="space-y-2">
                      {toc.map((item, index) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className="flex items-start gap-2 text-sm transition-colors group"
                          style={{ 
                            paddingLeft: `${(item.level - 2) * 8}px`,
                          }}
                        >
                          <span 
                            className="text-xs font-mono mt-0.5"
                            style={{ color: colors.accent }}
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="text-gray-600 group-hover:text-gray-900">
                            {item.text}
                          </span>
                        </a>
                      ))}
                    </nav>
                  </div>
                </div>
              </aside>
            )}

            {/* Main Content */}
            <div className="flex-1 max-w-3xl order-1 lg:order-2">
              {/* Tags */}
              {guide.post_tags && guide.post_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {guide.post_tags.map((pt) => (
                    <span 
                      key={pt.tags.id}
                      className="text-xs font-semibold px-3 py-1 rounded border"
                      style={{ 
                        borderColor: colors.primary,
                        color: colors.primary
                      }}
                    >
                      {pt.tags.name}
                    </span>
                  ))}
                </div>
              )}

              {/* TL;DR */}
              {guide.tldr && (
                <div 
                  className="p-6 rounded-xl mb-10 border-l-4"
                  style={{ 
                    backgroundColor: colors.surface,
                    borderColor: colors.accent
                  }}
                >
                  <div 
                    className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-3"
                    style={{ color: colors.accent }}
                  >
                    <BookOpen className="w-4 h-4" />
                    Résumé exécutif
                  </div>
                  <p className="text-gray-800 leading-relaxed">
                    {guide.tldr}
                  </p>
                </div>
              )}

              {/* Content */}
              <div className={`relative ${isPaywalled ? 'max-h-[600px] overflow-hidden' : ''}`}>
                <div
                  className="prose prose-lg max-w-none
                    prose-headings:font-bold prose-headings:text-gray-900
                    prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-200
                    prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                    prose-p:leading-relaxed prose-p:text-gray-700
                    prose-a:font-semibold prose-a:no-underline prose-a:border-b-2
                    prose-strong:font-bold prose-strong:text-gray-900
                    prose-ul:my-6 prose-ol:my-6
                    prose-li:my-1.5
                    prose-img:rounded-xl prose-img:border prose-img:border-gray-200"
                  style={{
                    '--tw-prose-links': colors.accent,
                  } as React.CSSProperties}
                  dangerouslySetInnerHTML={{ __html: contentWithIds }}
                />
                
                {isPaywalled && children}
              </div>

              {/* FAQ Accordion */}
              {!isPaywalled && guide.faq && guide.faq.length > 0 && (
                <div 
                  className="mt-16 p-8 rounded-xl"
                  style={{ backgroundColor: colors.primary }}
                >
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    Questions fréquentes
                    <span 
                      className="text-sm font-normal px-2 py-1 rounded"
                      style={{ backgroundColor: colors.accent, color: colors.primary }}
                    >
                      {guide.faq.length}
                    </span>
                  </h2>
                  <div className="space-y-2">
                    {guide.faq.map((item, index) => (
                      <div 
                        key={index} 
                        className="rounded-lg overflow-hidden"
                        style={{ backgroundColor: colors.secondary }}
                      >
                        <button
                          className="w-full p-4 text-left flex items-center justify-between"
                          onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        >
                          <span className="font-medium text-white">{item.question}</span>
                          {expandedFaq === index ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        {expandedFaq === index && (
                          <div 
                            className="px-4 pb-4 text-gray-300"
                            style={{ borderTop: `1px solid ${colors.primary}` }}
                          >
                            <p className="pt-4">{item.answer}</p>
                          </div>
                        )}
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