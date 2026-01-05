import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, Tag } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TableOfContents } from "@/components/TableOfContents";

interface GuideTemplateClassiqueProps {
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

export const GuideTemplateClassique = ({
  guide,
  contentWithIds,
  toc,
  readingTime,
  children,
  isPaywalled = false,
}: GuideTemplateClassiqueProps) => {
  const category = guide.post_categories?.[0]?.categories;

  return (
    <main className="pt-20">
      {/* Hero Section */}
      {guide.featured_image ? (
        <section className="relative h-[400px] lg:h-[500px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 z-10" />
          <img
            src={guide.featured_image}
            alt={guide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex items-end">
            <div className="container mx-auto px-4 pb-12">
              <Link 
                to="/guides"
                className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour aux guides
              </Link>
              {category && (
                <Link to={`/guides?category=${category.slug}`} className="inline-block mb-4 mt-2">
                  <Badge variant="secondary" className="bg-primary text-primary-foreground rounded-full px-4 py-1 cursor-pointer hover:bg-primary/90 transition-colors">
                    {category.name}
                  </Badge>
                </Link>
              )}
              <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 max-w-4xl">
                {guide.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                {guide.published_at && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(guide.published_at), "d MMMM yyyy", { locale: fr })}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {readingTime} min de lecture
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-muted py-16">
          <div className="container mx-auto px-4">
            <Link 
              to="/guides"
              className="inline-flex items-center gap-2 text-foreground hover:text-primary mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour aux guides
            </Link>
            {category && (
              <Badge variant="secondary" className="bg-primary text-primary-foreground rounded-full px-4 py-1 mb-4">
                {category.name}
              </Badge>
            )}
            <h1 className="text-3xl lg:text-5xl font-bold text-foreground mb-4 max-w-4xl">
              {guide.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
              {guide.published_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(guide.published_at), "d MMMM yyyy", { locale: fr })}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {readingTime} min de lecture
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Article Content with TOC */}
      <article className="py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Main Content */}
            <div className="flex-1 max-w-3xl">
              {/* Tags */}
              {guide.post_tags && guide.post_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {guide.post_tags.map((pt) => (
                    <Badge 
                      key={pt.tags.id}
                      variant="secondary"
                      className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 transition-colors px-3 py-1.5 flex items-center gap-1.5"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {pt.tags.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Excerpt */}
              {guide.excerpt && (
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed border-l-4 border-primary pl-6">
                  {guide.excerpt}
                </p>
              )}

              {/* TL;DR */}
              {guide.tldr && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
                  <h3 className="font-semibold text-primary mb-3">📌 En résumé</h3>
                  <p className="text-foreground whitespace-pre-line">{guide.tldr}</p>
                </div>
              )}

              {/* Content - with paywall wrapper if needed */}
              <div className={`relative ${isPaywalled ? 'max-h-[600px] overflow-hidden' : ''}`}>
                <div
                  className="prose prose-lg max-w-none
                    prose-headings:text-foreground prose-headings:font-bold
                    prose-p:text-foreground prose-p:leading-relaxed
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-foreground
                    prose-ul:text-foreground prose-ol:text-foreground
                    prose-li:marker:text-primary
                    prose-img:rounded-lg prose-img:shadow-md"
                  dangerouslySetInnerHTML={{ __html: contentWithIds }}
                />
                
                {/* Paywall overlay */}
                {isPaywalled && children}
              </div>

              {/* FAQ Section */}
              {!isPaywalled && guide.faq && guide.faq.length > 0 && (
                <div className="mt-12 border-t pt-8">
                  <h2 className="text-2xl font-bold mb-6">Questions fréquentes</h2>
                  <div className="space-y-4">
                    {guide.faq.map((item, index) => (
                      <div key={index} className="border rounded-lg p-6">
                        <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                        <p className="text-muted-foreground">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar with TOC */}
            {toc.length > 0 && !isPaywalled && (
              <aside className="hidden lg:block w-72 flex-shrink-0">
                <div className="sticky top-24">
                  <TableOfContents items={toc} />
                </div>
              </aside>
            )}
          </div>
        </div>
      </article>
    </main>
  );
};
