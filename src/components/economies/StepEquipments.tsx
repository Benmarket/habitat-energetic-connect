import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Flame, Sun, Layers, Droplets, Wind } from "lucide-react";
import type { EquipmentCategory, EquipmentStatus, SavingsReference } from "@/hooks/useMemberHomeProfile";
import { CATEGORY_LABELS } from "@/lib/economiesCalculator";

interface Details {
  year?: string;
  model?: string;
  power?: string;
}

interface Selection {
  equipment_key: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  details?: Details;
}

interface Props {
  reference: SavingsReference[];
  initial: Selection[];
  onSave: (items: Selection[]) => Promise<void>;
  onNext: () => void;
  onBack: () => void;
}

const ICONS: Record<EquipmentCategory, any> = {
  heating: Flame,
  solar: Sun,
  insulation: Layers,
  water: Droplets,
  ventilation: Wind,
};

const StepEquipments = ({ reference, initial, onSave, onNext, onBack }: Props) => {
  const [sel, setSel] = useState<Map<string, EquipmentStatus>>(
    new Map(initial.map((i) => [i.equipment_key, i.status]))
  );
  const [details, setDetails] = useState<Map<string, Details>>(
    new Map(initial.filter((i) => i.details).map((i) => [i.equipment_key, i.details!]))
  );

  const grouped = reference.reduce((acc, r) => {
    (acc[r.category] = acc[r.category] || []).push(r);
    return acc;
  }, {} as Record<EquipmentCategory, SavingsReference[]>);

  const BATTERY_KEY = "panneaux_solaires_pv_batterie";
  const PV_KEY = "panneaux_solaires_pv";

  const toggle = (key: string, status: EquipmentStatus) => {
    setSel((prev) => {
      const next = new Map(prev);
      if (next.get(key) === status) next.delete(key);
      else next.set(key, status);
      if (key === PV_KEY && !next.has(PV_KEY)) next.delete(BATTERY_KEY);
      return next;
    });
  };

  const updateDetail = (key: string, field: keyof Details, value: string) => {
    setDetails((prev) => {
      const next = new Map(prev);
      const cur = next.get(key) || {};
      next.set(key, { ...cur, [field]: value });
      return next;
    });
  };

  const handleSave = async () => {
    const items: Selection[] = [];
    sel.forEach((status, equipment_key) => {
      const ref = reference.find((r) => r.equipment_key === equipment_key);
      if (ref) items.push({
        equipment_key,
        category: ref.category,
        status,
        details: status === "owned" ? details.get(equipment_key) : undefined,
      });
    });
    await onSave(items);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Vos équipements énergétiques</h2>
        <p className="text-sm text-muted-foreground">
          Cochez ce que vous <strong>possédez déjà</strong> (vert) ou ce que vous <strong>souhaitez installer</strong> (bleu).
          Vos précédentes saisies ont été pré-remplies, vous pouvez les modifier librement.
        </p>
      </div>

      <div className="space-y-6">
        {(Object.keys(grouped) as EquipmentCategory[]).map((cat) => {
          const Icon = ICONS[cat];
          return (
            <Card key={cat} className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">{CATEGORY_LABELS[cat]}</h3>
              </div>
              <div className="space-y-2">
                {grouped[cat].map((r) => {
                  const current = sel.get(r.equipment_key);
                  const isBattery = r.equipment_key === BATTERY_KEY;
                  const disabled = isBattery && !sel.has(PV_KEY);
                  const showDetails = current === "owned";
                  const isInsulation = cat === "insulation";
                  const d = details.get(r.equipment_key) || {};
                  return (
                    <div
                      key={r.equipment_key}
                      className={cn(
                        "rounded-lg border-2 transition-colors",
                        current === "owned" && "border-emerald-500 bg-emerald-50",
                        current === "wanted" && "border-blue-500 bg-blue-50",
                        !current && "border-border",
                        disabled && "opacity-50"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3 p-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{r.label}</div>
                          {disabled ? (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              Sélectionnez d'abord des panneaux photovoltaïques.
                            </div>
                          ) : (
                            r.description && <div className="text-xs text-muted-foreground line-clamp-1">{r.description}</div>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            disabled={disabled}
                            onClick={() => toggle(r.equipment_key, "owned")}
                            className={cn(
                              "px-3 py-1.5 text-xs rounded-md font-medium transition-colors",
                              current === "owned"
                                ? "bg-emerald-500 text-white"
                                : "bg-muted text-muted-foreground hover:bg-emerald-100 hover:text-emerald-700",
                              disabled && "cursor-not-allowed hover:bg-muted hover:text-muted-foreground"
                            )}
                          >
                            J'ai déjà
                          </button>
                          <button
                            disabled={disabled}
                            onClick={() => toggle(r.equipment_key, "wanted")}
                            className={cn(
                              "px-3 py-1.5 text-xs rounded-md font-medium transition-colors",
                              current === "wanted"
                                ? "bg-blue-500 text-white"
                                : "bg-muted text-muted-foreground hover:bg-blue-100 hover:text-blue-700",
                              disabled && "cursor-not-allowed hover:bg-muted hover:text-muted-foreground"
                            )}
                          >
                            J'envisage
                          </button>
                        </div>
                      </div>
                      {showDetails && (
                        <div className="px-3 pb-3 pt-1 border-t border-emerald-200/60 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/50">
                          <div className="space-y-1">
                            <Label className="text-xs">Année d'installation</Label>
                            <Input
                              type="number"
                              placeholder="ex: 2018"
                              min={1950}
                              max={new Date().getFullYear()}
                              value={d.year || ""}
                              onChange={(e) => updateDetail(r.equipment_key, "year", e.target.value)}
                              className="h-9"
                            />
                          </div>
                          {!isInsulation && (
                            <>
                              <div className="space-y-1">
                                <Label className="text-xs">Modèle</Label>
                                <Input
                                  placeholder="ex: Daikin Altherma"
                                  value={d.model || ""}
                                  onChange={(e) => updateDetail(r.equipment_key, "model", e.target.value)}
                                  className="h-9"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Puissance <span className="text-muted-foreground">(facultatif)</span></Label>
                                <Input
                                  placeholder="ex: 8 kW"
                                  value={d.power || ""}
                                  onChange={(e) => updateDetail(r.equipment_key, "power", e.target.value)}
                                  className="h-9"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>Retour</Button>
        <Button size="lg" onClick={handleSave} className="hover:scale-105 transition-transform">
          Voir mon analyse
        </Button>
      </div>
    </div>
  );
};

export default StepEquipments;
