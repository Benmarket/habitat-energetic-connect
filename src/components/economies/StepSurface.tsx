import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Ruler, Info } from "lucide-react";

interface Props {
  surface: number | null;
  prefilledFromLead?: number | null;
  onSave: (m2: number) => Promise<void>;
  onNext: () => void;
  onBack: () => void;
}

const StepSurface = ({ surface, prefilledFromLead, onSave, onNext, onBack }: Props) => {
  const [v, setV] = useState<string>(surface?.toString() || prefilledFromLead?.toString() || "");
  const valid = Number(v) >= 10 && Number(v) <= 1000;

  const handleNext = async () => {
    await onSave(Number(v));
    onNext();
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Surface habitable</h2>
        <p className="text-sm text-muted-foreground">
          Indiquez la surface habitable de votre logement, en mètres carrés.
        </p>
      </div>

      {prefilledFromLead && !surface && (
        <div className="flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
          <Info className="w-4 h-4 mt-0.5 text-primary shrink-0" />
          <div>
            Nous avons trouvé une valeur dans une de vos précédentes simulations : <strong>{prefilledFromLead} m²</strong>.
            Vous pouvez la confirmer ou la corriger.
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="surf" className="font-semibold">Surface en m²</Label>
        <div className="relative mt-2">
          <Ruler className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="surf"
            type="number"
            min={10}
            max={1000}
            value={v}
            onChange={(e) => setV(e.target.value)}
            placeholder="120"
            className="pl-10"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Entre 10 et 1000 m²</p>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Retour</Button>
        <Button size="lg" disabled={!valid} onClick={handleNext} className="hover:scale-105 transition-transform">
          Continuer
        </Button>
      </div>
    </div>
  );
};

export default StepSurface;
