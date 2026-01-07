import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, Tag, BookOpen, Lightbulb, CheckCircle, Download, ChevronRight, Terminal } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { GuideDownloadModal } from "@/components/GuideDownloadModal";
import { useActiveSection } from "@/hooks/useActiveSection";

interface GuideTemplateExpertProps {
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
    is_downloadable?: boolean;
  };
  contentWithIds: string;
  toc: Array<{ id: string; text: string; level: number }>;
  readingTime: number;
  children?: ReactNode;
  isPaywalled?: boolean;
}

export const GuideTemplateExpert = ({
  guide,
  contentWithIds,
  toc,
  readingTime,
  children,
  isPaywalled = false,
}: GuideTemplateExpertProps) => {
  const category = guide.post_categories?.[0]?.categories;
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const { activeId, scrollProgress, scrollToSection } = useActiveSection(toc);
  
  const activeIndex = toc.findIndex(item => item.id === activeId);

  return (
    <main className="pt-20 bg-slate-50 min-h-screen">
      {/* Technical progress bar with section indicator */}
      <div className="fixed top-20 left-0 right-0 z-40 bg-slate-900">
        <div className="h-1 bg-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
        {/* Current section indicator */}
        <div className="hidden lg:flex container mx-auto px-4 py-2 items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Terminal className="w-4 h-4" />
            <span className="font-mono">{guide.slug}</span>
          </div>
          {activeId && (
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="font-mono">Section {activeIndex + 1}/{toc.length}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white font-medium truncate max-w-xs">
                {toc.find(t => t.id === activeId)?.text}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expert Header - Documentation style */}
      <section className="bg-slate-900 text-white pt-8 pb-16 lg:pt-12 lg:pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Link 
              to="/guides"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors text-sm font-mono"
            >
              <ArrowLeft className="w-4 h-4" />
              ../guides
            </Link>

            <div className="flex items-center gap-3 mb-6">
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono px-4 py-1.5 gap-2">
                <BookOpen className="w-4 h-4" />
                EXPERT
              </Badge>
              {category && (
                <Badge variant="outline" className="text-slate-300 border-slate-600 font-mono">
                  {category.name}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl lg:text-5xl font-bold mb-6 max-w-4xl leading-tight">
              {guide.title}
            </h1>

            {guide.excerpt && (
              <p className="text-lg text-slate-300 max-w-3xl mb-8 leading-relaxed">
                {guide.excerpt}
              </p>
            )}

            {/* Stats bar */}
            <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              {guide.published_at && (
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{format(new Date(guide.published_at), "d MMM yyyy", { locale: fr })}</span>
                </div>
              )}
              <div className="w-px h-6 bg-slate-700" />
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{readingTime} min</span>
              </div>
              <div className="w-px h-6 bg-slate-700" />
              <div className="flex items-center gap-2 text-slate-400">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">{toc.length} sections</span>
              </div>
              <div className="w-px h-6 bg-slate-700" />
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Dernière mise à jour récente</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image if exists */}
      {guide.featured_image && (
        <div className="container mx-auto px-4 -mt-8">
          <div className="max-w-6xl mx-auto">
            <img
              src={guide.featured_image}
              alt={guide.title}
              className="w-full h-64 lg:h-80 object-cover rounded-xl shadow-2xl border-4 border-white"
            />
          </div>
        </div>
      )}

      {/* Three-column layout */}
      <article className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Mini-nav - Progress tracker */}
              {toc.length > 0 && !isPaywalled && (
                <aside className="hidden lg:block lg:col-span-1">
                  <div className="sticky top-40">
                    <div className="flex flex-col items-center gap-1">
                      {toc.filter(t => t.level === 2).map((item, index) => (
                        <button
                          key={item.id}
                          onClick={() => scrollToSection(item.id)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                            activeId === item.id 
                              ? 'bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/30' 
                              : index < activeIndex
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                          }`}
                          title={item.text}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </aside>
              )}

              {/* Main Content */}
              <div className={`${toc.length > 0 && !isPaywalled ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 lg:p-10">
                  {/* Tags */}
                  {guide.post_tags && guide.post_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {guide.post_tags.map((pt) => (
                        <Badge 
                          key={pt.tags.id}
                          variant="outline"
                          className="bg-slate-100 text-slate-700 border-slate-300 px-3 py-1.5 font-mono text-xs"
                        >
                          #{pt.tags.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* TL;DR - Terminal style */}
                  {guide.tldr && (
                    <div className="bg-slate-900 text-white rounded-xl p-6 mb-10 font-mono">
                      <div className="flex items-center gap-2 mb-3 text-emerald-400 text-sm">
                        <Lightbulb className="w-4 h-4" />
                        <span>// TL;DR</span>
                      </div>
                      <p className="text-slate-300 whitespace-pre-line leading-relaxed text-sm">{guide.tldr}</p>
                    </div>
                  )}

                  {/* Content */}
                  <div className={`relative ${isPaywalled ? 'max-h-[600px] overflow-hidden' : ''}`}>
                    <div
                      className="prose prose-lg max-w-none
                        prose-headings:font-bold prose-headings:text-slate-900
                        prose-h2:text-2xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:flex prose-h2:items-center prose-h2:gap-3 prose-h2:scroll-mt-40
                        prose-h2:before:content-['#'] prose-h2:before:text-emerald-400 prose-h2:before:font-mono prose-h2:before:font-normal
                        prose-h3:text-xl prose-h3:mt-10 prose-h3:mb-4
                        prose-p:text-slate-700 prose-p:leading-relaxed
                        prose-a:text-emerald-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                        prose-code:bg-slate-100 prose-code:text-emerald-700 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm
                        prose-li:marker:text-emerald-500
                        prose-img:rounded-xl prose-img:shadow-lg prose-img:border prose-img:border-slate-200
                        prose-blockquote:border-l-emerald-500 prose-blockquote:bg-emerald-50 prose-blockquote:py-4 prose-blockquote:rounded-r-lg"
                      dangerouslySetInnerHTML={{ __html: contentWithIds }}
                    />
                    
                    {isPaywalled && children}
                  </div>

                  {/* FAQ Section */}
                  {!isPaywalled && guide.faq && guide.faq.length > 0 && (
                    <div className="mt-16 pt-12 border-t border-slate-200">
                      <h2 className="text-2xl font-bold mb-8 flex items-center gap-3 text-slate-900">
                        <span className="text-emerald-400 font-mono">&gt;</span>
                        FAQ
                      </h2>
                      <div className="space-y-4">
                        {guide.faq.map((item, index) => (
                          <div 
                            key={index} 
                            className="border border-slate-200 rounded-xl overflow-hidden hover:border-emerald-300 transition-colors"
                          >
                            <div className="bg-slate-50 p-5 flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                              <h3 className="font-bold text-slate-900">{item.question}</h3>
                            </div>
                            <div className="p-5 bg-white">
                              <p className="text-slate-600 leading-relaxed">{item.answer}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Download CTA */}
                  {!isPaywalled && guide.is_downloadable !== false && (
                    <div className="mt-12 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                          <h3 className="text-xl font-bold mb-2">Téléchargez ce guide</h3>
                          <p className="text-slate-300 text-sm">
                            Gardez ce guide sous la main pour vos projets.
                          </p>
                        </div>
                        <Button 
                          size="lg" 
                          className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 font-bold"
                          onClick={() => setDownloadModalOpen(true)}
                        >
                          <Download className="w-5 h-5" />
                          Télécharger PDF
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right TOC - Detailed */}
              {toc.length > 0 && !isPaywalled && (
                <aside className="hidden lg:block lg:col-span-3">
                  <div className="sticky top-40">
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-5">
                      <h4 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-4">
                        Dans ce guide
                      </h4>
                      <nav className="space-y-1">
                        {toc.map((item, index) => (
                          <button
                            key={item.id}
                            onClick={() => scrollToSection(item.id)}
                            className={`w-full text-left text-sm py-2 px-3 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                              activeId === item.id 
                                ? 'bg-emerald-50 text-emerald-700 font-medium border-l-2 border-emerald-500' 
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                            style={{ paddingLeft: `${12 + (item.level - 2) * 12}px` }}
                          >
                            {item.level === 2 && (
                              <span className={`w-5 h-5 rounded text-xs flex items-center justify-center font-mono ${
                                activeId === item.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {index + 1}
                              </span>
                            )}
                            <span className="truncate">{item.text}</span>
                          </button>
                        ))}
                      </nav>
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </div>
        </div>
      </article>

      <GuideDownloadModal
        open={downloadModalOpen}
        onOpenChange={setDownloadModalOpen}
        guideTitle={guide.title}
      />
    </main>
  );
};
