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
}: ArticlePreviewModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 gap-0">
        {/* Bouton fermer personnalisé */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full"
        >
          <X className="w-4 h-4" />
        </Button>

        <ScrollArea className="h-[95vh]">
          <div className="min-h-screen bg-background">
            {/* Hero Section with Featured Image - comme ArticleDetail */}
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
                    {/* Badge de prévisualisation */}
                    <Badge 
                      variant="secondary" 
                      className="bg-yellow-500 text-black rounded-full px-4 py-1 mb-4"
                    >
                      Prévisualisation
                    </Badge>
                    
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

            {/* Article Content - comme ArticleDetail */}
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
                    dangerouslySetInnerHTML={{ __html: content }}
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};