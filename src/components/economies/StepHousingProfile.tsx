import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Building2, KeyRound, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HousingStatus, HousingType } from "@/hooks/useMemberHomeProfile";

interface Props {
  housingStatus: HousingStatus | null;
  housingType: HousingType | null;
  onChange: (patch: { housing_status?: HousingStatus; housing_type?: HousingType }) => void;
  onNext: () => void;
}

const Choice = ({
  active,
  onClick,
  icon: Icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  sub?: string;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "group p-6 rounded-2xl border-2 transition-all text-left flex flex-col items-center gap-3 hover:scale-105",
      active
        ? "border-primary bg-primary/5 shadow-lg"
        : "border-border bg-card hover:border-primary/40"
    )}
  >
    <div
      className={cn(
        "w-16 h-16 rounded-2xl flex items-center justify-center transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}
    >
      <Icon className="w-8 h-8" />
    </div>
    <div className="text-center">
      <div className="font-semibold">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  </button>
);

const StepHousingProfile = ({ housingStatus, housingType, onChange, onNext }: Props) => {
  const ready = housingStatus && housingType;
  return (
    <div className="space-y-10">
      <div className="space-y-4 flex flex-col items-center">
        <h2 className="text-xl font-bold text-center">Êtes-vous propriétaire ?</h2>
        <div className="grid grid-cols-2 gap-4 max-w-xl w-full">
          <Choice
            active={housingStatus === "proprietaire"}
            onClick={() => onChange({ housing_status: "proprietaire" })}
            icon={KeyRound}
            label="Propriétaire"
            sub="Je peux décider des travaux"
          />
          <Choice
            active={housingStatus === "locataire"}
            onClick={() => onChange({ housing_status: "locataire" })}
            icon={User}
            label="Locataire"
            sub="J'occupe le logement"
          />
        </div>
      </div>

      <div className="space-y-4 flex flex-col items-center">
        <h2 className="text-xl font-bold text-center">Type de logement</h2>
        <div className="grid grid-cols-2 gap-4 max-w-xl w-full">
          <Choice
            active={housingType === "maison"}
            onClick={() => onChange({ housing_type: "maison" })}
            icon={Home}
            label="Maison"
            sub="Individuelle"
          />
          <Choice
            active={housingType === "appartement"}
            onClick={() => onChange({ housing_type: "appartement" })}
            icon={Building2}
            label="Appartement"
            sub="En immeuble"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <Button size="lg" disabled={!ready} onClick={onNext} className="hover:scale-105 transition-transform">
          Continuer
        </Button>
      </div>
    </div>
  );
};

export default StepHousingProfile;
