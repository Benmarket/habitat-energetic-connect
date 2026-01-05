import { ReactNode, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, Tag, BookOpen, Lightbulb, AlertTriangle, CheckCircle, Download } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { GuideDownloadModal } from "@/components/GuideDownloadModal";

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
  const [progress, setProgress] = useState(0);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  // Reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrollTop = window.scrollY;
      const progressPercent = (scrollTop / documentHeight) * 100;
      setProgress(Math.min(progressPercent, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="pt-20">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Expert Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-12">
        <div className="container mx-auto px-4">
          <Link 
            to="/guides"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux guides
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold px-4 py-1.5 gap-1.5">
              <BookOpen className="w-4 h-4" />
              Guide Expert
            </Badge>
            {category && (
              <Badge variant="outline" className="text-slate-300 border-slate-600">
                {category.name}
              </Badge>
            )}
          </div>

          <h1 className="text-3xl lg:text-5xl font-bold mb-6 max-w-4xl">
            {guide.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-slate-400">
            {guide.published_at && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(guide.published_at), "d MMMM yyyy", { locale: fr })}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{readingTime} min de lecture</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>{toc.length} sections</span>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image if exists */}
      {guide.featured_image && (
        <div className="relative -mt-4 mx-4 lg:mx-auto lg:max-w-5xl">
          <img
            src={guide.featured_image}
            alt={guide.title}
            className="w-full h-64 lg:h-96 object-cover rounded-xl shadow-2xl"
          />
        </div>
      )}

      {/* Content Section */}
      <article className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Tags */}
          {guide.post_tags && guide.post_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {guide.post_tags.map((pt) => (
                <Badge 
                  key={pt.tags.id}
                  variant="outline"
                  className="bg-slate-100 text-slate-700 border-slate-300 px-3 py-1.5 flex items-center gap-1.5"
                >
                  <Tag className="w-3.5 h-3.5" />
                  {pt.tags.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Excerpt */}
          {guide.excerpt && (
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed font-medium">
              {guide.excerpt}
            </p>
          )}

          {/* TL;DR - Expert styled */}
          {guide.tldr && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-10">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-800 mb-2">À retenir</h3>
                  <p className="text-emerald-900 whitespace-pre-line">{guide.tldr}</p>
                </div>
              </div>
            </div>
          )}

          {/* Numbered Table of Contents */}
          {toc.length > 0 && !isPaywalled && (
            <div className="bg-slate-50 rounded-xl p-6 mb-10 border border-slate-200">
              <h4 className="font-bold text-lg mb-4">Dans ce guide</h4>
              <nav className="space-y-2">
                {toc.filter(item => item.level === 2).map((item, index) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors group"
                  >
                    <span className="w-8 h-8 bg-slate-200 group-hover:bg-primary group-hover:text-white rounded-lg flex items-center justify-center font-bold text-sm transition-colors">
                      {index + 1}
                    </span>
                    <span className="font-medium group-hover:text-primary transition-colors">{item.text}</span>
                  </a>
                ))}
              </nav>
            </div>
          )}

          {/* Content */}
          <div className={`relative ${isPaywalled ? 'max-h-[600px] overflow-hidden' : ''}`}>
            <div
              className="prose prose-lg max-w-none
                prose-headings:text-foreground prose-headings:font-bold
                prose-h2:text-2xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:flex prose-h2:items-center prose-h2:gap-3
                prose-h2:before:content-[''] prose-h2:before:w-1 prose-h2:before:h-8 prose-h2:before:bg-emerald-500 prose-h2:before:rounded-full
                prose-p:text-foreground prose-p:leading-relaxed
                prose-a:text-emerald-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground prose-strong:font-bold
                prose-ul:text-foreground prose-ol:text-foreground
                prose-li:marker:text-emerald-500
                prose-img:rounded-xl prose-img:shadow-lg
                prose-blockquote:border-l-emerald-500 prose-blockquote:bg-emerald-50 prose-blockquote:py-2 prose-blockquote:rounded-r-lg"
              dangerouslySetInnerHTML={{ __html: contentWithIds }}
            />
            
            {isPaywalled && children}
          </div>

          {/* FAQ Section - Expert styled */}
          {!isPaywalled && guide.faq && guide.faq.length > 0 && (
            <div className="mt-16 pt-12 border-t">
              <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                <span className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white text-lg">?</span>
                Questions fréquentes
              </h2>
              <div className="space-y-4">
                {guide.faq.map((item, index) => (
                  <div 
                    key={index} 
                    className="border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <div className="bg-slate-50 p-5">
                      <h3 className="font-bold flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {item.question}
                      </h3>
                    </div>
                    <div className="p-5">
                      <p className="text-muted-foreground">{item.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Download CTA */}
          {!isPaywalled && guide.is_downloadable !== false && (
            <div className="mt-12 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-3">Téléchargez ce guide</h3>
              <p className="text-slate-300 mb-6">
                Gardez ce guide sous la main pour vos projets de rénovation.
              </p>
              <Button 
                size="lg" 
                className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
                onClick={() => setDownloadModalOpen(true)}
              >
                <Download className="w-5 h-5" />
                Télécharger en PDF
              </Button>
            </div>
          )}
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
