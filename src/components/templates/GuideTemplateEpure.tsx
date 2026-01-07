import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, Tag, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TableOfContents } from "@/components/TableOfContents";

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
  surface: '#f8fafc',
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

  return (
    <main className="pt-20 min-h-screen" style={{ backgroundColor: colors.surface }}>
      {/* Minimal Header */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: colors.primary }}>
        <div className="container mx-auto px-4 max-w-4xl">
          <Link 
            to="/guides"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Guides
          </Link>
          
          {category && (
            <div className="mb-6">
              <span 
                className="text-sm font-medium tracking-wider uppercase"
                style={{ color: colors.accent }}
              >
                {category.name}
              </span>
            </div>
          )}
          
          <h1 
            className="text-4xl lg:text-6xl font-light text-white leading-tight mb-8"
            style={{ letterSpacing: '-0.02em' }}
          >
            {guide.title}
          </h1>
          
          {guide.excerpt && (
            <p className="text-xl text-white/80 font-light max-w-2xl">
              {guide.excerpt}
            </p>
          )}
          
          <div className="flex items-center gap-6 mt-8 text-white/60 text-sm">
            {guide.published_at && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {format(new Date(guide.published_at), "d MMMM yyyy", { locale: fr })}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {readingTime} min
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image */}
      {guide.featured_image && (
        <div className="container mx-auto px-4 max-w-5xl -mt-8">
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={guide.featured_image}
              alt={guide.title}
              className="w-full h-[400px] lg:h-[500px] object-cover"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <article className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-16 max-w-6xl mx-auto">
            {/* Main Content */}
            <div className="flex-1 max-w-3xl">
              {/* Tags */}
              {guide.post_tags && guide.post_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-10">
                  {guide.post_tags.map((pt) => (
                    <span 
                      key={pt.tags.id}
                      className="text-xs font-medium px-3 py-1.5 rounded-full"
                      style={{ 
                        backgroundColor: `${colors.accent}15`,
                        color: colors.accent 
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
                  className="p-8 rounded-2xl mb-12"
                  style={{ backgroundColor: `${colors.accent}08` }}
                >
                  <div 
                    className="text-xs font-semibold uppercase tracking-wider mb-3"
                    style={{ color: colors.accent }}
                  >
                    L'essentiel
                  </div>
                  <p className="text-lg leading-relaxed" style={{ color: colors.primary }}>
                    {guide.tldr}
                  </p>
                </div>
              )}

              {/* Content */}
              <div className={`relative ${isPaywalled ? 'max-h-[600px] overflow-hidden' : ''}`}>
                <div
                  className="prose prose-lg max-w-none
                    prose-headings:font-light prose-headings:tracking-tight
                    prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6
                    prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-4
                    prose-p:leading-relaxed prose-p:text-gray-700
                    prose-a:no-underline prose-a:border-b-2 prose-a:border-current
                    prose-strong:font-semibold
                    prose-ul:my-6 prose-ol:my-6
                    prose-li:my-2
                    prose-img:rounded-2xl prose-img:shadow-lg"
                  style={{
                    '--tw-prose-links': colors.accent,
                    '--tw-prose-headings': colors.primary,
                  } as React.CSSProperties}
                  dangerouslySetInnerHTML={{ __html: contentWithIds }}
                />
                
                {isPaywalled && children}
              </div>

              {/* FAQ */}
              {!isPaywalled && guide.faq && guide.faq.length > 0 && (
                <div className="mt-20 pt-12 border-t border-gray-200">
                  <h2 
                    className="text-3xl font-light mb-10"
                    style={{ color: colors.primary }}
                  >
                    Questions fréquentes
                  </h2>
                  <div className="space-y-6">
                    {guide.faq.map((item, index) => (
                      <div 
                        key={index} 
                        className="p-6 rounded-xl transition-colors hover:bg-gray-50"
                        style={{ backgroundColor: colors.surface }}
                      >
                        <h3 
                          className="text-lg font-medium mb-3 flex items-start gap-3"
                          style={{ color: colors.primary }}
                        >
                          <ChevronRight 
                            className="w-5 h-5 mt-0.5 flex-shrink-0"
                            style={{ color: colors.accent }}
                          />
                          {item.question}
                        </h3>
                        <p className="text-gray-600 pl-8">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            {toc.length > 0 && !isPaywalled && (
              <aside className="hidden lg:block w-64 flex-shrink-0">
                <div className="sticky top-24">
                  <div 
                    className="text-xs font-semibold uppercase tracking-wider mb-4"
                    style={{ color: colors.accent }}
                  >
                    Sommaire
                  </div>
                  <nav className="space-y-3">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="block text-sm text-gray-500 hover:text-gray-900 transition-colors"
                        style={{ 
                          paddingLeft: `${(item.level - 2) * 12}px`,
                        }}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}
          </div>
        </div>
      </article>
    </main>
  );
};