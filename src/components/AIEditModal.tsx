import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { Label } from "@/components/ui/label";

interface AIEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (instructions: string) => void;
  loading: boolean;
  variantId: number;
}

export const AIEditModal = ({
  open,
  onOpenChange,
  onSubmit,
  loading,
  variantId,
}: AIEditModalProps) => {
  const [instructions, setInstructions] = useState("");

  // Réinitialiser les instructions quand la modale s'ouvre
  useEffect(() => {
    if (open) {
      setInstructions("");
    }
  }, [open]);

  const handleSubmit = () => {
    if (instructions.trim()) {
      onSubmit(instructions.trim());
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            IA Rédaction - Variante {variantId}
          </DialogTitle>
          <DialogDescription>
            Décrivez précisément les modifications souhaitées pour améliorer cette variante
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="instructions" className="text-base font-medium">
              Instructions de modification *
            </Label>
            <Textarea
              id="instructions"
              placeholder='Exemples concrets:&#10;&#10;• "Ajoute 500 mots minimum sur les avantages fiscaux"&#10;• "Remplace tous les boutons verts par des boutons rouges"&#10;• "Change l&apos;image principale pour une installation solaire en France"&#10;• "Simplifie le langage technique pour le grand public"&#10;• "Ajoute une section FAQ avec 5 questions"&#10;• "Cite des sources officielles comme ADEME"&#10;&#10;Soyez le plus précis possible!'
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[220px] text-base"
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              {instructions.trim().length > 0 
                ? `${instructions.trim().length} caractères` 
                : "Minimum 10 caractères requis"}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              💡 Conseils pour de meilleurs résultats :
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>Soyez très précis et détaillé dans vos instructions</li>
              <li>Mentionnez les nombres exacts (ex: "minimum 1080 mots")</li>
              <li>Spécifiez les éléments visuels (couleurs, images, boutons)</li>
              <li>Indiquez le ton souhaité (technique, grand public, etc.)</li>
              <li>Citez des sources ou exemples si nécessaire</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || instructions.trim().length < 10}
              className="gap-2 min-w-[200px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Régénération en cours...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Régénérer la variante
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};