import { ReactNode, useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowLeft, Sparkles, Zap, Star } from "lucide-react";
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
    topline?: string;
    topline_bg_color?: string;
    topline_text_color?: string;
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
  const category = guide.post_categories?.[0]?.categories;
  const colors = guide.template_colors || DEFAULT_COLORS;
  const { activeId, scrollProgress, scrollToSection } = useActiveSection(toc);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Transformer les bandeaux CTA pour le rendu
  const transformedContent = useMemo(() => transformCtaBannersInHtml(contentWithIds), [contentWithIds]);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <main className="pt-20 min-h-screen overflow-hidden" style={{ backgroundColor: colors.surface }}>
      {/* Animated gradient progress bar */}
      <div className="fixed top-20 left-0 right-0 h-1.5 z-50 bg-gray-200">
        <div 
          className="h-full transition-all duration-100 relative"
          style={{ 
            width: `${scrollProgress}%`,
            background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent}, ${colors.primary})`
          }}
        >
          {/* Shimmer effect */}
          <div 
            className="absolute inset-0 opacity-50"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)',
              animation: 'shimmer 2s infinite'
            }}
          />
        </div>
      </div>

      {/* Animated Hero with blobs */}
      <section 
        className="relative py-24 lg:py-36 overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.primary} 100%)`
        }}
      >
        {/* Animated blob shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute -top-20 -left-20 w-96 h-96 rounded-full blur-3xl opacity-30 animate-pulse"
            style={{ backgroundColor: colors.accent, animationDuration: '4s' }}
          />
          <div 
            className="absolute top-1/2 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20 animate-pulse"
            style={{ backgroundColor: colors.surface, animationDuration: '5s', animationDelay: '1s' }}
          />
          <div 
            className="absolute -bottom-32 left-1/3 w-72 h-72 rounded-full blur-3xl opacity-25 animate-pulse"
            style={{ backgroundColor: colors.accent, animationDuration: '6s', animationDelay: '2s' }}
          />
        </div>

        {/* Animated waves at bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg 
            viewBox="0 0 1440 200" 
            className="w-full h-auto"
            preserveAspectRatio="none"
          >
            <path 
              fill={colors.surface}
              opacity="0.15"
              d="M0,100 C240,180 480,20 720,100 C960,180 1200,20 1440,100 L1440,200 L0,200 Z"
            >
              <animate 
                attributeName="d" 
                dur="8s" 
                repeatCount="indefinite"
                values="
                  M0,100 C240,180 480,20 720,100 C960,180 1200,20 1440,100 L1440,200 L0,200 Z;
                  M0,100 C240,20 480,180 720,100 C960,20 1200,180 1440,100 L1440,200 L0,200 Z;
                  M0,100 C240,180 480,20 720,100 C960,180 1200,20 1440,100 L1440,200 L0,200 Z
                "
              />
            </path>
            <path 
              fill={colors.surface}
              opacity="0.3"
              d="M0,120 C360,80 720,160 1080,120 C1260,100 1440,140 1440,140 L1440,200 L0,200 Z"
            >
              <animate 
                attributeName="d" 
                dur="6s" 
                repeatCount="indefinite"
                values="
                  M0,120 C360,80 720,160 1080,120 C1260,100 1440,140 1440,140 L1440,200 L0,200 Z;
                  M0,120 C360,160 720,80 1080,120 C1260,140 1440,100 1440,100 L1440,200 L0,200 Z;
                  M0,120 C360,80 720,160 1080,120 C1260,100 1440,140 1440,140 L1440,200 L0,200 Z
                "
              />
            </path>
            <path 
              fill={colors.surface}
              d="M0,160 Q360,120 720,160 T1440,160 L1440,200 L0,200 Z"
            />
          </svg>
        </div>

        <div className={`container mx-auto px-4 max-w-5xl relative z-10 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Link 
            to="/guides"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-10 transition-all hover:-translate-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux guides
          </Link>
          
          {category && (
            <div 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8 animate-bounce"
              style={{ 
                backgroundColor: colors.accent,
                animationDuration: '2s'
              }}
            >
              <Sparkles className="w-5 h-5 text-white" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                {category.name}
              </span>
            </div>
          )}
          
          <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight mb-8">
            {guide.title}
          </h1>
          
          {guide.excerpt && (
            <p className="text-xl lg:text-2xl text-white/90 max-w-3xl leading-relaxed font-light">
              {guide.excerpt}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-4 mt-10">
            {guide.published_at && (
              <div 
                className="flex items-center gap-2 px-5 py-3 rounded-full backdrop-blur-md"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <Calendar className="w-5 h-5 text-white" />
                <span className="text-white font-medium">
                  {format(new Date(guide.published_at), "d MMMM yyyy", { locale: fr })}
                </span>
              </div>
            )}
            <div 
              className="flex items-center gap-2 px-5 py-3 rounded-full backdrop-blur-md"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
            >
              <Clock className="w-5 h-5 text-white" />
              <span className="text-white font-medium">{readingTime} min de lecture</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Image with gradient border */}
      {guide.featured_image && (
        <div className="container mx-auto px-4 max-w-5xl -mt-20 relative z-20">
          <div 
            className="p-1.5 rounded-3xl shadow-2xl relative"
            style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent}, ${colors.secondary})` }}
          >
            {/* Topline Banner */}
            {guide.topline && (
              <div className="absolute top-6 left-0 right-0 z-30 flex justify-center px-4">
                <div 
                  className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg"
                  style={{
                    backgroundColor: guide.topline_bg_color || '#22c55e',
                    color: guide.topline_text_color || '#ffffff',
                  }}
                >
                  {guide.topline}
                </div>
              </div>
            )}
            <img
              src={guide.featured_image}
              alt={guide.title}
              className="w-full h-[400px] lg:h-[500px] object-cover rounded-[1.25rem]"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <article className="py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:pr-80">
          <div className="max-w-3xl mx-auto lg:ml-0">
            {/* Main Content */}
              {/* Tags with 3D hover effect */}
              {guide.post_tags && guide.post_tags.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-12">
                  {guide.post_tags.map((pt) => (
                    <span 
                      key={pt.tags.id}
                      className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg cursor-default"
                      style={{ 
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                        color: 'white',
                        boxShadow: `0 4px 15px ${colors.primary}40`
                      }}
                    >
                      <Zap className="w-4 h-4" />
                      {pt.tags.name}
                    </span>
                  ))}
                </div>
              )}

              {/* TL;DR with animated gradient border */}
              {guide.tldr && (
                <div 
                  className="relative p-1 rounded-3xl mb-14"
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent}, ${colors.secondary}, ${colors.primary})`
                  }}
                >
                  <div 
                    className="p-8 rounded-[1.25rem]"
                    style={{ backgroundColor: colors.surface }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                      >
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <span 
                        className="text-sm font-bold uppercase tracking-wider"
                        style={{ color: colors.primary }}
                      >
                        En bref
                      </span>
                    </div>
                    <p className="text-lg leading-relaxed text-gray-700">
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
                    prose-h2:text-3xl prose-h2:mt-20 prose-h2:mb-8 prose-h2:scroll-mt-28
                    prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-5
                    prose-p:leading-[1.8] prose-p:text-gray-600
                    prose-a:font-bold prose-a:no-underline prose-a:bg-gradient-to-r prose-a:from-transparent prose-a:to-transparent prose-a:bg-[length:100%_2px] prose-a:bg-bottom prose-a:bg-no-repeat hover:prose-a:bg-[length:100%_100%] prose-a:transition-all
                    prose-strong:font-bold
                    prose-ul:my-8 prose-ol:my-8
                    prose-li:my-2
                    prose-img:rounded-3xl prose-img:shadow-2xl"
                  style={{
                    '--tw-prose-links': colors.primary,
                    '--tw-prose-headings': colors.primary,
                    '--tw-prose-bullets': colors.accent,
                  } as React.CSSProperties}
                  dangerouslySetInnerHTML={{ __html: transformedContent }}
                />
                
                {isPaywalled && children}
              </div>

              {/* FAQ with cards */}
              {!isPaywalled && guide.faq && guide.faq.length > 0 && (
                <div className="mt-24">
                  <div 
                    className="inline-flex items-center gap-3 px-6 py-3 rounded-full mb-10"
                    style={{ background: `linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}15)` }}
                  >
                    <Star style={{ color: colors.accent }} className="w-5 h-5" />
                    <h2 
                      className="text-2xl font-bold"
                      style={{ color: colors.primary }}
                    >
                      Questions fréquentes
                    </h2>
                  </div>
                  <div className="grid gap-4">
                    {guide.faq.map((item, index) => (
                      <div 
                        key={index} 
                        className="p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
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
                        <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </article>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </main>
  );
};
