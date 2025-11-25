import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, Tag } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ArticleVariant {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeywords?: string[];
  featuredImageUrl?: string;
}

interface ArticleVariantsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variants: ArticleVariant[] | null;
  loading: boolean;
  onSelectVariant: (variant: ArticleVariant) => void;
}

export const ArticleVariantsModal = ({
  open,
  onOpenChange,
  variants,
  loading,
  onSelectVariant,
}: ArticleVariantsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Articles générés par IA
          </DialogTitle>
          <DialogDescription>
            Prévisualisez et choisissez la variante qui correspond le mieux à vos besoins
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Génération des articles en cours...</p>
            <p className="text-sm text-muted-foreground">Cela peut prendre quelques instants</p>
          </div>
        ) : variants && variants.length > 0 ? (
          <ScrollArea className="max-h-[calc(90vh-120px)] px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
              {variants.map((variant) => (
                <Card 
                  key={variant.id} 
                  className="overflow-hidden hover:shadow-lg transition-all border-2 hover:border-primary"
                >
                  <CardContent className="p-0">
                    {/* Header avec bouton */}
                    <div className="p-4 bg-muted/50 flex items-center justify-between border-b sticky top-0 z-10 backdrop-blur-sm">
                      <h3 className="font-bold text-lg">Variante {variant.id}</h3>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          onSelectVariant(variant);
                          onOpenChange(false);
                        }}
                        className="gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Choisir cette version
                      </Button>
                    </div>

                    {/* Preview de l'article */}
                    <ScrollArea className="h-[600px]">
                      <div className="p-4">
                        {/* Image principale */}
                        {variant.featuredImageUrl && (
                          <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-4 shadow-md">
                            <img
                              src={variant.featuredImageUrl}
                              alt={variant.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Tags / Focus Keywords */}
                        {variant.focusKeywords && variant.focusKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {variant.focusKeywords.map((keyword, idx) => (
                              <Badge 
                                key={idx}
                                variant="secondary"
                                className="bg-blue-50 text-blue-600 border-blue-200 text-xs flex items-center gap-1"
                              >
                                <Tag className="w-3 h-3" />
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Titre */}
                        <h1 className="text-2xl font-bold text-foreground mb-3 leading-tight">
                          {variant.title}
                        </h1>

                        {/* Meta Title (si différent) */}
                        {variant.metaTitle && variant.metaTitle !== variant.title && (
                          <div className="mb-3 p-2 bg-muted/30 rounded text-xs">
                            <span className="font-semibold text-muted-foreground">Titre SEO: </span>
                            <span className="text-foreground">{variant.metaTitle}</span>
                          </div>
                        )}

                        {/* Extrait */}
                        {variant.excerpt && (
                          <>
                            <p className="text-base text-muted-foreground mb-4 leading-relaxed border-l-4 border-primary pl-4 italic">
                              {variant.excerpt}
                            </p>
                            <Separator className="my-4" />
                          </>
                        )}

                        {/* Meta Description */}
                        {variant.metaDescription && (
                          <div className="mb-4 p-2 bg-muted/30 rounded text-xs">
                            <span className="font-semibold text-muted-foreground">Description SEO: </span>
                            <span className="text-foreground">{variant.metaDescription}</span>
                          </div>
                        )}

                        {/* Contenu complet */}
                        <div 
                          className="prose prose-sm max-w-none 
                            prose-headings:text-foreground 
                            prose-p:text-foreground 
                            prose-strong:text-foreground 
                            prose-ul:text-foreground 
                            prose-ol:text-foreground 
                            prose-li:text-foreground 
                            prose-a:text-primary 
                            prose-h1:text-xl prose-h1:font-bold prose-h1:mb-3 prose-h1:mt-6
                            prose-h2:text-lg prose-h2:font-bold prose-h2:mb-2 prose-h2:mt-5
                            prose-h3:text-base prose-h3:font-semibold prose-h3:mb-2 prose-h3:mt-4
                            prose-p:mb-3 prose-p:leading-relaxed
                            prose-img:rounded-lg prose-img:shadow-md prose-img:my-4
                            prose-ul:my-3 prose-ol:my-3
                            prose-li:mb-1"
                          dangerouslySetInnerHTML={{ __html: variant.content }}
                        />

                        {/* Statistiques */}
                        <Separator className="my-4" />
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>≈ {Math.round(variant.content.replace(/<[^>]*>/g, '').split(/\s+/).length)} mots</span>
                          <span>≈ {Math.ceil(variant.content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200)} min de lecture</span>
                        </div>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Aucune variante générée
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};