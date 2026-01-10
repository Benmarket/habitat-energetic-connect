import { ReactNode, useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, Tag, Star, Crown, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useActiveSection } from "@/hooks/useActiveSection";
import { transformCtaBannersInHtml } from "@/utils/contentRenderer";

interface GuideTemplatePremiumProps {
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

export const GuideTemplatePremium = ({
  guide,
  contentWithIds,
  toc,
  readingTime,
  children,
  isPaywalled = false,
}: GuideTemplatePremiumProps) => {
  const category = guide.post_categories?.[0]?.categories;
  const { activeId, scrollProgress, scrollToSection } = useActiveSection(toc);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Transformer les bandeaux CTA pour le rendu
  const transformedContent = useMemo(() => transformCtaBannersInHtml(contentWithIds), [contentWithIds]);

  // Track mouse for glow effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main className="pt-20 min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div 
        className="fixed w-[600px] h-[600px] rounded-full pointer-events-none z-0 transition-all duration-500 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)',
          left: mousePosition.x - 300,
          top: mousePosition.y - 300,
        }}
      />
      
      {/* Premium gold progress bar */}
      <div className="fixed top-20 left-0 right-0 h-1 z-40 bg-amber-100">
        <div 
          className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 transition-all duration-150 shadow-[0_0_20px_rgba(251,191,36,0.5)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Premium Hero Section */}
      <section className="relative min-h-[550px] lg:min-h-[650px] overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0">
          {guide.featured_image ? (
            <img
              src={guide.featured_image}
              alt={guide.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-100" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/40" />
          
          {/* Decorative gold particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-amber-400/40 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Bottom decorative border */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-16 flex flex-col justify-end min-h-[550px] lg:min-h-[650px]">
          <Link 
            to="/guides"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-all hover:-translate-x-1 w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux guides
          </Link>

          {/* Premium Badge */}
          <div className="flex items-center gap-3 mb-6">
            <Badge className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-900 font-bold px-5 py-2 gap-2 shadow-lg shadow-amber-400/30">
              <Crown className="w-4 h-4" />
              Guide Premium
            </Badge>
            {category && (
              <Badge variant="outline" className="bg-white/10 backdrop-blur-sm text-white border-white/30 px-4 py-2">
                {category.name}
              </Badge>
            )}
          </div>

          <h1 className="text-4xl lg:text-6xl font-extrabold text-white mb-6 max-w-4xl leading-tight drop-shadow-lg">
            {guide.title}
          </h1>

          {guide.excerpt && (
            <p className="text-xl text-white/90 max-w-2xl mb-8 leading-relaxed font-light">
              {guide.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            {guide.published_at && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white/90">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{format(new Date(guide.published_at), "d MMMM yyyy", { locale: fr })}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white/90">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{readingTime} min de lecture</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid Layout */}
      <article className="py-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content - 8 columns */}
            <div className="lg:col-span-8">
              {/* Glass card wrapper */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-amber-100/50 p-8 lg:p-12">
                {/* Tags */}
                {guide.post_tags && guide.post_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {guide.post_tags.map((pt) => (
                      <Badge 
                        key={pt.tags.id}
                        className="bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border border-amber-200 px-4 py-1.5 gap-1.5 hover:shadow-md transition-shadow"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        {pt.tags.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* TL;DR - Premium styled */}
                {guide.tldr && (
                  <div className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 rounded-2xl p-8 mb-10 overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/30 to-transparent rounded-full blur-2xl" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-bold text-amber-900 text-lg">Points clés</h3>
                      </div>
                      <p className="text-amber-800 whitespace-pre-line leading-relaxed">{guide.tldr}</p>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className={`relative ${isPaywalled ? 'max-h-[600px] overflow-hidden' : ''}`}>
                  <div
                    className="prose prose-lg max-w-none
                      prose-headings:text-gray-900 prose-headings:font-bold
                      prose-h2:text-2xl prose-h2:mt-14 prose-h2:mb-6 prose-h2:pb-4 prose-h2:border-b-2 prose-h2:border-amber-200 prose-h2:scroll-mt-28
                      prose-p:text-gray-700 prose-p:leading-relaxed
                      prose-a:text-amber-600 prose-a:font-semibold prose-a:no-underline hover:prose-a:text-amber-700
                      prose-strong:text-amber-700
                      prose-li:marker:text-amber-500
                      prose-img:rounded-2xl prose-img:shadow-xl prose-img:border prose-img:border-amber-100"
                    dangerouslySetInnerHTML={{ __html: transformedContent }}
                  />
                  
                  {isPaywalled && children}
                </div>

                {/* FAQ Section */}
                {!isPaywalled && guide.faq && guide.faq.length > 0 && (
                  <div className="mt-16 pt-12 border-t-2 border-amber-200">
                    <h2 className="text-3xl font-bold mb-10 flex items-center gap-3 text-gray-900">
                      <span className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg">
                        ?
                      </span>
                      Questions fréquentes
                    </h2>
                    <div className="space-y-4">
                      {guide.faq.map((item, index) => (
                        <div 
                          key={index} 
                          className="bg-gradient-to-br from-amber-50/50 to-yellow-50/50 border-2 border-amber-100 rounded-2xl p-6 hover:border-amber-300 hover:shadow-lg transition-all duration-300"
                        >
                          <h3 className="font-bold text-lg mb-3 text-amber-900">{item.question}</h3>
                          <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Espace réservé pour le sommaire sticky global */}
            <aside className="lg:col-span-4">
              {/* L'espace est réservé pour le composant GuideStickyNav qui apparaît au scroll */}
            </aside>
          </div>
        </div>
      </article>
    </main>
  );
};
