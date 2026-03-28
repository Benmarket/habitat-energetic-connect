import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, Tag, Wand2, Undo2, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AIEditModal } from "./AIEditModal";
import { useState, useEffect, useRef } from "react";

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
  onRegenerateVariant?: (variantId: number, instructions: string) => void;
  regeneratingVariantId?: number | null;
  previousVersions?: Map<number, ArticleVariant>;
  onRestorePreviousVersion?: (variantId: number) => void;
}

export const ArticleVariantsModal = ({
  open,
  onOpenChange,
  variants,
  loading,
  onSelectVariant,
  onRegenerateVariant,
  regeneratingVariantId,
  previousVersions,
  onRestorePreviousVersion,
}: ArticleVariantsModalProps) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedVariantForEdit, setSelectedVariantForEdit] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer pendant le chargement
  useEffect(() => {
    if (loading) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [loading]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 
      ? `${mins}m ${secs.toString().padStart(2, '0')}s` 
      : `${secs}s`;
  };

  const handleOpenEditModal = (variantId: number) => {
    setSelectedVariantForEdit(variantId);
    setEditModalOpen(true);
  };

  const handleSubmitEdit = (instructions: string) => {
    if (selectedVariantForEdit && onRegenerateVariant) {
      onRegenerateVariant(selectedVariantForEdit, instructions);
      setEditModalOpen(false);
    }
  };

  const currentVariant = variants?.find(v => v.id === selectedVariantForEdit);
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="font-mono font-medium">{formatTime(elapsedSeconds)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Cela peut prendre quelques instants</p>
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
                    {/* Header avec boutons */}
                    <div className="p-4 bg-muted/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b sticky top-0 z-10 backdrop-blur-sm">
                      <h3 className="font-bold text-lg">Variante {variant.id}</h3>
                      <div className="flex gap-2 flex-wrap">
                        {previousVersions?.has(variant.id) && onRestorePreviousVersion && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onRestorePreviousVersion(variant.id)}
                            className="gap-2"
                            disabled={regeneratingVariantId === variant.id}
                          >
                            <Undo2 className="w-4 h-4" />
                            Version précédente
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleOpenEditModal(variant.id)}
                          className="gap-2"
                          disabled={regeneratingVariantId === variant.id}
                        >
                          {regeneratingVariantId === variant.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Régénération...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4" />
                              IA Rédaction
                            </>
                          )}
                        </Button>
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

        <AIEditModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSubmit={handleSubmitEdit}
          loading={regeneratingVariantId === selectedVariantForEdit}
          variantId={selectedVariantForEdit || 1}
        />
      </DialogContent>
    </Dialog>
  );
};