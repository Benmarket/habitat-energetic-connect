import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Prévisualisation de l'article</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-8rem)]">
          <div className="space-y-6 p-6">
            {/* Featured Image */}
            {featuredImage && (
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                <img
                  src={featuredImage}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Meta Info */}
            <div className="space-y-2">
              {metaTitle && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold">Titre SEO:</span> {metaTitle}
                </div>
              )}
              {metaDescription && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold">Description SEO:</span> {metaDescription}
                </div>
              )}
            </div>

            {/* Focus Keywords */}
            {focusKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {focusKeywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>

            {/* Excerpt */}
            {excerpt && (
              <p className="text-lg text-muted-foreground italic border-l-4 border-primary pl-4">
                {excerpt}
              </p>
            )}

            {/* Content */}
            <div
              className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
