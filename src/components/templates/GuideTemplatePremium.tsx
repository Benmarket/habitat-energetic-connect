import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, Tag, Star } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

  return (
    <main className="pt-20">
      {/* Premium Hero Section */}
      <section className="relative min-h-[500px] lg:min-h-[600px] overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0">
          {guide.featured_image ? (
            <img
              src={guide.featured_image}
              alt={guide.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-16 flex flex-col justify-end min-h-[500px] lg:min-h-[600px]">
          <Link 
            to="/guides"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux guides
          </Link>

          {/* Premium Badge */}
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold px-4 py-1.5 gap-1.5">
              <Star className="w-4 h-4 fill-current" />
              Guide Premium
            </Badge>
            {category && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {category.name}
              </Badge>
            )}
          </div>

          <h1 className="text-4xl lg:text-6xl font-extrabold text-white mb-6 max-w-3xl leading-tight">
            {guide.title}
          </h1>

          {guide.excerpt && (
            <p className="text-xl text-white/90 max-w-2xl mb-8 leading-relaxed">
              {guide.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-6 text-white/80">
            {guide.published_at && (
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{format(new Date(guide.published_at), "d MMMM yyyy", { locale: fr })}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{readingTime} min de lecture</span>
            </div>
          </div>
        </div>
      </section>

      {/* Two-column Layout */}
      <article className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content - 2/3 width */}
            <div className="lg:col-span-2">
              {/* Tags */}
              {guide.post_tags && guide.post_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {guide.post_tags.map((pt) => (
                    <Badge 
                      key={pt.tags.id}
                      variant="outline"
                      className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1.5 flex items-center gap-1.5"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {pt.tags.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* TL;DR - Premium styled */}
              {guide.tldr && (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-400 rounded-r-lg p-6 mb-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <h3 className="font-bold text-amber-800">Points clés</h3>
                  </div>
                  <p className="text-amber-900 whitespace-pre-line">{guide.tldr}</p>
                </div>
              )}

              {/* Content */}
              <div className={`relative ${isPaywalled ? 'max-h-[600px] overflow-hidden' : ''}`}>
                <div
                  className="prose prose-lg max-w-none
                    prose-headings:text-foreground prose-headings:font-extrabold
                    prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b-2 prose-h2:border-primary/20
                    prose-p:text-foreground prose-p:leading-relaxed prose-p:text-lg
                    prose-a:text-primary prose-a:font-semibold prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-primary
                    prose-ul:text-foreground prose-ol:text-foreground
                    prose-li:marker:text-primary prose-li:text-lg
                    prose-img:rounded-xl prose-img:shadow-xl"
                  dangerouslySetInnerHTML={{ __html: contentWithIds }}
                />
                
                {isPaywalled && children}
              </div>

              {/* FAQ Section - Premium styled */}
              {!isPaywalled && guide.faq && guide.faq.length > 0 && (
                <div className="mt-16 border-t-2 border-primary/10 pt-12">
                  <h2 className="text-3xl font-extrabold mb-8 flex items-center gap-3">
                    <span className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">?</span>
                    Questions fréquentes
                  </h2>
                  <div className="space-y-4">
                    {guide.faq.map((item, index) => (
                      <div 
                        key={index} 
                        className="border-2 border-primary/10 rounded-xl p-6 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
                      >
                        <h3 className="font-bold text-lg mb-3 text-primary">{item.question}</h3>
                        <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - 1/3 width */}
            {!isPaywalled && (
              <aside className="hidden lg:block">
                <div className="sticky top-24 space-y-6">
                  {/* TOC Card */}
                  {toc.length > 0 && (
                    <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/10">
                      <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-white font-bold">
                          {toc.length}
                        </span>
                        Sommaire
                      </h4>
                      <nav className="space-y-2">
                        {toc.map((item) => (
                          <a
                            key={item.id}
                            href={`#${item.id}`}
                            className={`block text-sm hover:text-primary transition-colors ${
                              item.level === 2 ? 'font-medium' : 'pl-4 text-muted-foreground'
                            }`}
                          >
                            {item.text}
                          </a>
                        ))}
                      </nav>
                    </div>
                  )}

                  {/* CTA Card */}
                  <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white">
                    <h4 className="font-bold text-lg mb-2">Besoin d'aide ?</h4>
                    <p className="text-white/80 text-sm mb-4">
                      Nos experts sont là pour vous accompagner dans vos projets.
                    </p>
                    <Link 
                      to="/#contact" 
                      className="inline-block bg-white text-primary font-semibold px-4 py-2 rounded-lg hover:bg-white/90 transition-colors"
                    >
                      Nous contacter
                    </Link>
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
