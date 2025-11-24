import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ArticleVariant {
  id: number;
  title: string;
  content: string;
  excerpt: string;
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
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Articles générés par IA
          </DialogTitle>
          <DialogDescription>
            Choisissez la variante qui correspond le mieux à vos besoins
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Génération des articles en cours...</p>
            <p className="text-sm text-muted-foreground">Cela peut prendre quelques instants</p>
          </div>
        ) : variants && variants.length > 0 ? (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {variants.map((variant) => (
                <Card 
                  key={variant.id} 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    onSelectVariant(variant);
                    onOpenChange(false);
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>Variante {variant.id}</span>
                      <Button size="sm" variant="outline">
                        Choisir cette version
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">Titre</h4>
                      <p className="font-medium">{variant.title}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">Extrait</h4>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {variant.excerpt}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                        Aperçu du contenu ({Math.round(variant.content.length / 4)} mots environ)
                      </h4>
                      <div 
                        className="text-sm text-muted-foreground line-clamp-4 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: variant.content.slice(0, 300) + '...' }}
                      />
                    </div>
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