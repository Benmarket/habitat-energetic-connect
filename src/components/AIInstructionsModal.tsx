import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { FileText, RotateCcw } from "lucide-react";

interface AIInstructionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultInstructions: string;
  currentInstructions: string;
  onSave: (instructions: string) => void;
}

export const AIInstructionsModal = ({
  open,
  onOpenChange,
  defaultInstructions,
  currentInstructions,
  onSave,
}: AIInstructionsModalProps) => {
  const [instructions, setInstructions] = useState(currentInstructions);

  useEffect(() => {
    if (open) {
      setInstructions(currentInstructions);
    }
  }, [open, currentInstructions]);

  const handleSave = () => {
    onSave(instructions);
    onOpenChange(false);
  };

  const handleReset = () => {
    setInstructions(defaultInstructions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Instructions article IA
          </DialogTitle>
          <DialogDescription>
            Personnalisez les instructions pour la génération de cet article. Ces modifications sont temporaires et ne s'appliqueront qu'à cette génération.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="instructions" className="text-base font-medium">
                Instructions personnalisées
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-4 h-4" />
                Réinitialiser aux instructions par défaut
              </Button>
            </div>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Préférences supplémentaires en matière de comportement, de style et de ton&#10;&#10;Exemple:&#10;- Adopte un ton professionnel et technique&#10;- Utilise des exemples concrets et chiffrés&#10;- Structure l'article avec des sous-titres clairs&#10;- Intègre des statistiques récentes (2024-2025)"
              className="min-h-[300px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {instructions.length} caractères
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
            <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm">
              💡 Conseils pour les instructions :
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-blue-800 dark:text-blue-200">
              <li>Définissez le ton souhaité (professionnel, pédagogique, technique...)</li>
              <li>Précisez les éléments à inclure ou éviter</li>
              <li>Indiquez le niveau de détail attendu</li>
              <li>Mentionnez les formats spécifiques (listes, tableaux...)</li>
            </ul>
          </div>

          {defaultInstructions && instructions !== defaultInstructions && (
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-900 text-sm">
              <p className="text-amber-900 dark:text-amber-100">
                ⚠️ Vous avez modifié les instructions par défaut. Ces modifications ne s'appliqueront qu'à cette génération.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSave}
          >
            Utiliser ces instructions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};