import { ReactNode, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, Tag, Sparkles, Zap } from "lucide-react";
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
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#f59e0b',
  surface: '#fefbff',
};

interface GuideTemplateVibrantProps {
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

export const GuideTemplateVibrant = ({
  guide,
  contentWithIds,
  toc,
  readingTime,
  children,
  isPaywalled = false,
}: GuideTemplateVibrantProps) => {
  const [scrollProgress, setScrollProgress] = useState(0);
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
    <main className="pt-20 min-h-screen" style={{ backgroundColor: colors.surface }}>
      {/* Progress Bar */}
      <div className="fixed top-20 left-0 right-0 h-1 z-50 bg-gray-200">
        <div 
          className="h-full transition-all duration-100"
          style={{ 
            width: `${scrollProgress}%`,
            background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})`
          }}
        />
      </div>

      {/* Animated Hero */}
      <section 
        className="relative py-20 lg:py-32 overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
        }}
      >
        {/* Animated Waves */}
        <div className="absolute inset-0 overflow-hidden">
          <svg 
            className="absolute bottom-0 left-0 right-0 w-full"
            viewBox="0 0 1440 200" 
            preserveAspectRatio="none"
            style={{ height: '200px' }}
          >
            <path 
              fill={colors.surface}
              opacity="0.1"
              d="M0,100 C240,200 480,0 720,100 C960,200 1200,0 1440,100 L1440,200 L0,200 Z"
            >
              <animate 
                attributeName="d" 
                dur="10s" 
                repeatCount="indefinite"
                values="
                  M0,100 C240,200 480,0 720,100 C960,200 1200,0 1440,100 L1440,200 L0,200 Z;
                  M0,100 C240,0 480,200 720,100 C960,0 1200,200 1440,100 L1440,200 L0,200 Z;
                  M0,100 C240,200 480,0 720,100 C960,200 1200,0 1440,100 L1440,200 L0,200 Z
                "
              />
            </path>
          </svg>
          <svg 
            className="absolute bottom-0 left-0 right-0 w-full"
            viewBox="0 0 1440 200" 
            preserveAspectRatio="none"
            style={{ height: '150px' }}
          >
            <path 
              fill={colors.surface}
              d="M0,150 C360,50 720,250 1080,150 C1260,100 1440,150 1440,150 L1440,200 L0,200 Z"
            />
          </svg>
        </div>

        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <Link 
            to="/guides"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-all hover:-translate-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux guides
          </Link>
          
          {category && (
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{ backgroundColor: colors.accent }}
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-sm font-bold text-white uppercase tracking-wide">
                {category.name}
              </span>
            </div>
          )}
          
          <h1 className="text-4xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            {guide.title}
          </h1>
          
          {guide.excerpt && (
            <p className="text-xl text-white/90 max-w-2xl leading-relaxed">
              {guide.excerpt}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-6 mt-8">
            {guide.published_at && (
              <div 
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <Calendar className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">
                  {format(new Date(guide.published_at), "d MMMM yyyy", { locale: fr })}
                </span>
              </div>
            )}
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Clock className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">{readingTime} min de lecture</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image with Overlay Effect */}
      {guide.featured_image && (
        <div className="container mx-auto px-4 max-w-5xl -mt-16 relative z-20">
          <div 
            className="rounded-3xl overflow-hidden shadow-2xl p-2"
            style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})` }}
          >
            <img
              src={guide.featured_image}
              alt={guide.title}
              className="w-full h-[350px] lg:h-[450px] object-cover rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <article className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
            {/* Main Content */}
            <div className="flex-1 max-w-3xl">
              {/* Tags */}
              {guide.post_tags && guide.post_tags.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-10">
                  {guide.post_tags.map((pt) => (
                    <span 
                      key={pt.tags.id}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-transform hover:scale-105"
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                        color: 'white'
                      }}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      {pt.tags.name}
                    </span>
                  ))}
                </div>
              )}

              {/* TL;DR */}
              {guide.tldr && (
                <div 
                  className="relative p-8 rounded-3xl mb-12 overflow-hidden"
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}15)`
                  }}
                >
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-30"
                    style={{ backgroundColor: colors.accent }}
                  />
                  <div className="relative z-10">
                    <div 
                      className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-4"
                      style={{ color: colors.primary }}
                    >
                      <Sparkles className="w-4 h-4" />
                      En bref
                    </div>
                    <p className="text-lg leading-relaxed text-gray-800">
                      {guide.tldr}
                    </p>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className={`relative ${isPaywalled ? 'max-h-[600px] overflow-hidden' : ''}`}>
                <div
                  className="prose prose-lg max-w-none
                    prose-headings:font-bold
                    prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:relative
                    prose-h3:text-2xl prose-h3:mt-10 prose-h3:mb-4
                    prose-p:leading-relaxed prose-p:text-gray-700
                    prose-a:font-semibold prose-a:no-underline
                    prose-strong:font-bold
                    prose-ul:my-6 prose-ol:my-6
                    prose-li:my-2
                    prose-img:rounded-2xl prose-img:shadow-xl"
                  style={{
                    '--tw-prose-links': colors.primary,
                    '--tw-prose-headings': colors.primary,
                  } as React.CSSProperties}
                  dangerouslySetInnerHTML={{ __html: contentWithIds }}
                />
                
                {isPaywalled && children}
              </div>

              {/* FAQ */}
              {!isPaywalled && guide.faq && guide.faq.length > 0 && (
                <div className="mt-20 pt-12 border-t-4" style={{ borderColor: colors.accent }}>
                  <h2 
                    className="text-3xl font-bold mb-10 flex items-center gap-3"
                    style={{ color: colors.primary }}
                  >
                    <Sparkles style={{ color: colors.accent }} />
                    Questions fréquentes
                  </h2>
                  <div className="space-y-4">
                    {guide.faq.map((item, index) => (
                      <div 
                        key={index} 
                        className="p-6 rounded-2xl border-2 transition-all hover:shadow-lg"
                        style={{ 
                          borderColor: `${colors.primary}20`,
                          backgroundColor: 'white'
                        }}
                      >
                        <h3 
                          className="text-lg font-bold mb-3"
                          style={{ color: colors.primary }}
                        >
                          {item.question}
                        </h3>
                        <p className="text-gray-600">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky TOC */}
            {toc.length > 0 && !isPaywalled && (
              <aside className="hidden lg:block w-72 flex-shrink-0">
                <div className="sticky top-28">
                  <div 
                    className="p-6 rounded-2xl"
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.primary}10, ${colors.secondary}10)`
                    }}
                  >
                    <div 
                      className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2"
                      style={{ color: colors.primary }}
                    >
                      <Sparkles className="w-4 h-4" style={{ color: colors.accent }} />
                      Sommaire
                    </div>
                    <nav className="space-y-3">
                      {toc.map((item) => (
                        <a
                          key={item.id}
                          href={`#${item.id}`}
                          className="block text-sm font-medium transition-all hover:translate-x-1"
                          style={{ 
                            paddingLeft: `${(item.level - 2) * 12}px`,
                            color: colors.primary,
                            opacity: 0.7,
                          }}
                        >
                          {item.text}
                        </a>
                      ))}
                    </nav>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </article>
    </main>
  );
};