import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
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

  const handleSubmit = () => {
    if (instructions.trim()) {
      onSubmit(instructions);
    }
  };

  const handleClose = () => {
    setInstructions("");
    onOpenChange(false);
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
            Décrivez les modifications souhaitées pour améliorer cette variante
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions de modification</Label>
            <Textarea
              id="instructions"
              placeholder='Exemples:&#10;- "minimum 1080 mots"&#10;- "parle uniquement de ce sujet"&#10;- "ne mentionne pas ce point"&#10;- "cite telle source"&#10;- "ajoute des statistiques récentes"'
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[200px]"
              disabled={loading}
            />
          </div>

          <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
            <p className="font-semibold mb-2">💡 Conseils :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Soyez précis dans vos instructions</li>
              <li>Indiquez un nombre de mots si nécessaire</li>
              <li>Mentionnez les sujets à développer ou éviter</li>
              <li>Demandez des sources ou exemples spécifiques</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !instructions.trim()}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Génération en cours...
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