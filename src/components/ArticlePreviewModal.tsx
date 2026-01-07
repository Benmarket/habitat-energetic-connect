import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Tag, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';
import { addHeadingIds, extractTableOfContents } from '@/utils/tableOfContents';
import { transformCtaBannersInHtml } from '@/utils/contentRenderer';
import { calculateReadingTime } from '@/utils/readingTime';
import { GuideTemplateClassique } from '@/components/templates/GuideTemplateClassique';
import { GuideTemplateEpure } from '@/components/templates/GuideTemplateEpure';
import { GuideTemplatePremium } from '@/components/templates/GuideTemplatePremium';
import { GuideTemplateExpert } from '@/components/templates/GuideTemplateExpert';
import { GuideTemplateSombre } from '@/components/templates/GuideTemplateSombre';
import { GuideTemplateVibrant } from '@/components/templates/GuideTemplateVibrant';

interface ArticlePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  featuredImage?: string;
  excerpt?: string;
  focusKeywords: string[];
  metaTitle?: string;
  metaDescription?: string;
  contentType?: string;
  guideTemplate?: 'classique' | 'premium' | 'expert' | 'epure' | 'vibrant' | 'sombre';
  tldr?: string;
  faq?: Array<{ question: string; answer: string }>;
  categoryName?: string;
}

export const ArticlePreviewModal = ({
  open,
  onOpenChange,
  title,
  content,
  featuredImage,
  excerpt,
  focusKeywords,
  metaTitle,
  metaDescription,
  contentType,
  guideTemplate = 'classique',
  tldr,
  faq,
  categoryName,
}: ArticlePreviewModalProps) => {
  // Process content for guide templates
  const { contentWithIds, toc, readingTime } = useMemo(() => {
    const processedContent = addHeadingIds(content || '');
    // Transformer les bandeaux CTA pour le rendu
    const contentWithBanners = transformCtaBannersInHtml(processedContent);
    const tocItems = extractTableOfContents(processedContent);
    const time = calculateReadingTime(content || '');
    return {
      contentWithIds: contentWithBanners,
      toc: tocItems,
      readingTime: time,
    };
  }, [content]);

  // Build guide object for templates
  const guideData = useMemo(() => ({
    title: title || 'Titre du guide',
    slug: 'preview',
    excerpt,
    content: contentWithIds,
    featured_image: featuredImage,
    published_at: new Date().toISOString(),
    tldr,
    faq,
    post_categories: categoryName ? [{
      categories: { id: 'preview', name: categoryName, slug: 'preview' }
    }] : [],
    post_tags: focusKeywords.map((keyword, index) => ({
      tags: { id: `tag-${index}`, name: keyword, slug: keyword.toLowerCase() }
    })),
  }), [title, excerpt, contentWithIds, featuredImage, tldr, faq, categoryName, focusKeywords]);

  // Render guide template if contentType is 'guide'
  const renderGuidePreview = () => {
    const templateProps = {
      guide: guideData,
      contentWithIds,
      toc,
      readingTime,
      isPaywalled: false,
    };

    switch (guideTemplate) {
      case 'epure':
        return <GuideTemplateEpure {...templateProps} />;
      case 'premium':
        return <GuideTemplatePremium {...templateProps} />;
      case 'expert':
        return <GuideTemplateExpert {...templateProps} />;
      case 'sombre':
        return <GuideTemplateSombre {...templateProps} />;
      case 'vibrant':
        return <GuideTemplateVibrant {...templateProps} />;
      case 'classique':
      default:
        return <GuideTemplateClassique {...templateProps} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] p-0 gap-0 overflow-hidden">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Preview badge */}
        <div className="absolute left-4 top-4 z-50">
          <Badge className="bg-yellow-500 text-black font-semibold px-4 py-1.5">
            Prévisualisation {guideTemplate && contentType === 'guide' ? `• Template ${guideTemplate}` : ''}
          </Badge>
        </div>

        <ScrollArea className="h-[95vh]">
          {contentType === 'guide' ? (
            // Render the selected guide template
            <div className="pt-0">
              {renderGuidePreview()}
            </div>
          ) : (
            // Default article preview for actualités and aides
            <div className="min-h-screen bg-background">
              {/* Hero Section with Featured Image */}
              <section className="relative h-[300px] lg:h-[400px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 z-10" />
                {featuredImage ? (
                  <img
                    src={featuredImage}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
                )}
                <div className="absolute inset-0 z-20 flex items-end">
                  <div className="container mx-auto px-6 pb-8">
                    <div className="max-w-4xl">
                      <h1 className="text-2xl lg:text-4xl font-bold text-white mb-3 leading-tight">
                        {title || 'Titre de l\'article'}
                      </h1>
                      <div className="flex items-center text-white/90 text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        {format(new Date(), "d MMMM yyyy", { locale: fr })}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Article Content */}
              <article className="py-8 lg:py-12 bg-background">
                <div className="container mx-auto px-6 max-w-4xl">
                  {/* Tags Section */}
                  {focusKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {focusKeywords.map((keyword, index) => (
                        <Badge 
                          key={index}
                          variant="secondary"
                          className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 transition-colors px-3 py-1.5 flex items-center gap-1.5"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Meta Info Section */}
                  {(metaTitle || metaDescription) && (
                    <div className="bg-muted/30 border border-border rounded-lg p-4 mb-6 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Métadonnées SEO
                      </p>
                      {metaTitle && (
                        <div className="text-sm">
                          <span className="font-semibold text-foreground">Titre SEO:</span>{' '}
                          <span className="text-muted-foreground">{metaTitle}</span>
                        </div>
                      )}
                      {metaDescription && (
                        <div className="text-sm">
                          <span className="font-semibold text-foreground">Description SEO:</span>{' '}
                          <span className="text-muted-foreground">{metaDescription}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Excerpt */}
                  {excerpt && (
                    <p className="text-lg lg:text-xl text-muted-foreground mb-6 leading-relaxed border-l-4 border-primary pl-6 italic">
                      {excerpt}
                    </p>
                  )}
                  
                  {/* Content */}
                  {content ? (
                    <div 
                      className="prose prose-lg max-w-none 
                        prose-headings:text-foreground 
                        prose-p:text-foreground 
                        prose-strong:text-foreground 
                        prose-ul:text-foreground 
                        prose-ol:text-foreground 
                        prose-li:text-foreground 
                        prose-a:text-primary 
                        prose-h1:text-3xl 
                        prose-h2:text-2xl 
                        prose-h3:text-xl
                        prose-img:rounded-lg
                        prose-img:shadow-md"
                      dangerouslySetInnerHTML={{ __html: transformCtaBannersInHtml(content) }}
                    />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p className="text-lg">Aucun contenu à prévisualiser</p>
                      <p className="text-sm mt-2">Commencez à rédiger votre article pour voir l'aperçu</p>
                    </div>
                  )}
                </div>
              </article>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
