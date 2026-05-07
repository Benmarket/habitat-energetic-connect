import type { HomeEquipment, SavingsReference } from "@/hooks/useMemberHomeProfile";

export interface EquipmentSavings {
  reference: SavingsReference;
  yearlyEur: number;
  status: "owned" | "wanted" | "missing";
}

export function computeSavings(
  reference: SavingsReference[],
  equipments: HomeEquipment[],
  surface: number | null
): EquipmentSavings[] {
  const surf = surface || 0;
  const ownedKeys = new Set(equipments.filter((e) => e.status === "owned").map((e) => e.equipment_key));
  const wantedKeys = new Set(equipments.filter((e) => e.status === "wanted").map((e) => e.equipment_key));

  return reference.map((ref) => {
    const yearly = Number(ref.avg_savings_per_year_eur || 0) + Number(ref.avg_savings_per_m2_eur || 0) * surf;
    let status: "owned" | "wanted" | "missing" = "missing";
    if (ownedKeys.has(ref.equipment_key)) status = "owned";
    else if (wantedKeys.has(ref.equipment_key)) status = "wanted";
    return { reference: ref, yearlyEur: Math.round(yearly), status };
  });
}

export function totalRealised(savings: EquipmentSavings[]) {
  return savings.filter((s) => s.status === "owned").reduce((acc, s) => acc + s.yearlyEur, 0);
}

export function totalPotential(savings: EquipmentSavings[]) {
  return savings.filter((s) => s.status !== "owned").reduce((acc, s) => acc + s.yearlyEur, 0);
}

export const CATEGORY_LABELS: Record<string, string> = {
  heating: "Chauffage",
  solar: "Solaire",
  insulation: "Isolation",
  water: "Eau chaude",
  ventilation: "Ventilation",
};
