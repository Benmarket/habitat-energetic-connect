import { ReactNode, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowLeft, Minus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useActiveSection } from "@/hooks/useActiveSection";

interface TemplateColors {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
}

const DEFAULT_COLORS: TemplateColors = {
  primary: '#1a1a2e',
  secondary: '#16213e',
  accent: '#e94560',
  surface: '#fafafa',
};

interface GuideTemplateEpureProps {
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

export const GuideTemplateEpure = ({
  guide,
  contentWithIds,
  toc,
  readingTime,
  children,
  isPaywalled = false,
}: GuideTemplateEpureProps) => {
  const category = guide.post_categories?.[0]?.categories;
  const colors = guide.template_colors || DEFAULT_COLORS;
  const { activeId, scrollProgress, scrollToSection } = useActiveSection(toc);
  const [isVisible, setIsVisible] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className="pt-20 min-h-screen" style={{ backgroundColor: colors.surface }}>
      {/* Elegant thin progress line */}
      <div className="fixed top-20 left-0 right-0 h-px z-40 bg-gray-200">
        <div 
          className="h-full transition-all duration-300 ease-out"
          style={{ 
            width: `${scrollProgress}%`,
            backgroundColor: colors.accent
          }}
        />
      </div>

      {/* Minimalist Header - Full width with huge typography */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Link 
              to="/guides"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-12 transition-colors text-sm tracking-wide uppercase"
            >
              <ArrowLeft className="w-4 h-4" />
              Guides
            </Link>
            
            {category && (
              <div className="mb-6">
                <span 
                  className="text-sm font-medium tracking-[0.2em] uppercase"
                  style={{ color: colors.accent }}
                >
                  {category.name}
                </span>
              </div>
            )}
            
            <h1 
              className="text-5xl lg:text-7xl xl:text-8xl font-extralight leading-[0.95] mb-10 max-w-5xl"
              style={{ color: colors.primary, letterSpacing: '-0.03em' }}
            >
              {guide.title}
            </h1>
            
            {guide.excerpt && (
              <p className="text-xl lg:text-2xl font-light max-w-3xl leading-relaxed text-gray-500">
                {guide.excerpt}
              </p>
            )}
            
            <div className="flex items-center gap-8 mt-12 text-sm text-gray-400">
              {guide.published_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(guide.published_at), "d MMMM yyyy", { locale: fr })}
                </div>
              )}
              <div className="w-px h-4 bg-gray-300" />
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {readingTime} min
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-width Featured Image with fade edges */}
      {guide.featured_image && (
        <div className="relative w-full h-[50vh] lg:h-[70vh] overflow-hidden">
          <img
            src={guide.featured_image}
            alt={guide.title}
            className="w-full h-full object-cover"
          />
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${colors.surface} 0%, transparent 15%, transparent 85%, ${colors.surface} 100%)`
            }}
          />
        </div>
      )}

      {/* Content - Magazine style single column */}
      <article className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          {/* Floating mini TOC - appears on scroll */}
          {toc.length > 0 && !isPaywalled && (
            <div className="fixed left-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-2 z-30">
              {toc.filter(item => item.level === 2).map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activeId === item.id 
                      ? 'scale-150' 
                      : 'hover:scale-125 opacity-40 hover:opacity-70'
                  }`}
                  style={{ 
                    backgroundColor: activeId === item.id ? colors.accent : colors.primary 
                  }}
                  title={item.text}
                />
              ))}
            </div>
          )}

          <div className="max-w-3xl mx-auto" ref={contentRef}>
            {/* Tags - minimal pills */}
            {guide.post_tags && guide.post_tags.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-16">
                {guide.post_tags.map((pt) => (
                  <span 
                    key={pt.tags.id}
                    className="text-xs tracking-wider uppercase px-4 py-2 rounded-full border transition-colors hover:bg-gray-100"
                    style={{ borderColor: colors.primary, color: colors.primary }}
                  >
                    {pt.tags.name}
                  </span>
                ))}
              </div>
            )}

            {/* TL;DR - Pull quote style */}
            {guide.tldr && (
              <div className="relative my-20 py-12">
                <div 
                  className="absolute left-0 top-0 bottom-0 w-px"
                  style={{ backgroundColor: colors.accent }}
                />
                <p 
                  className="text-2xl lg:text-3xl font-light leading-relaxed pl-8"
                  style={{ color: colors.primary }}
                >
                  {guide.tldr}
                </p>
              </div>
            )}

            {/* Content */}
            <div className={`relative ${isPaywalled ? 'max-h-[600px] overflow-hidden' : ''}`}>
              <div
                className="prose prose-lg lg:prose-xl max-w-none
                  prose-headings:font-light prose-headings:tracking-tight
                  prose-h2:text-4xl prose-h2:mt-24 prose-h2:mb-8 prose-h2:scroll-mt-28
                  prose-h3:text-2xl prose-h3:mt-16 prose-h3:mb-6
                  prose-p:leading-[1.9] prose-p:text-gray-600 prose-p:font-light
                  prose-a:no-underline prose-a:border-b prose-a:border-current prose-a:pb-0.5
                  prose-strong:font-medium prose-strong:text-gray-900
                  prose-blockquote:border-l-0 prose-blockquote:pl-0 prose-blockquote:text-2xl prose-blockquote:font-light prose-blockquote:italic
                  prose-img:rounded-none prose-img:shadow-none prose-img:my-16"
                style={{
                  '--tw-prose-links': colors.accent,
                  '--tw-prose-headings': colors.primary,
                } as React.CSSProperties}
                dangerouslySetInnerHTML={{ __html: contentWithIds }}
              />
              
              {isPaywalled && children}
            </div>

            {/* FAQ - Accordion minimal */}
            {!isPaywalled && guide.faq && guide.faq.length > 0 && (
              <div className="mt-32 pt-16 border-t border-gray-200">
                <h2 
                  className="text-4xl font-light mb-16"
                  style={{ color: colors.primary }}
                >
                  Questions fréquentes
                </h2>
                <div className="divide-y divide-gray-200">
                  {guide.faq.map((item, index) => (
                    <div key={index} className="py-8 group">
                      <h3 
                        className="text-lg font-medium mb-4 flex items-start gap-4"
                        style={{ color: colors.primary }}
                      >
                        <Minus 
                          className="w-5 h-5 mt-1 flex-shrink-0 transition-transform group-hover:scale-125"
                          style={{ color: colors.accent }}
                        />
                        {item.question}
                      </h3>
                      <p className="text-gray-500 pl-9 leading-relaxed">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </main>
  );
};
