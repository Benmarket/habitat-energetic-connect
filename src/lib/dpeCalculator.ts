import type { DpeGrade, HomeEquipment } from "@/hooks/useMemberHomeProfile";

/**
 * Estimation simplifiée du DPE.
 * Score brut basé sur surface + équipements présents.
 * NB : ce n'est PAS un calcul 3CL réglementaire, juste une estimation indicative.
 */
export function estimateDpe(surface: number | null, equipments: HomeEquipment[]): DpeGrade {
  let score = 50; // base "D"

  const owned = new Set(equipments.filter((e) => e.status === "owned").map((e) => e.equipment_key));

  // Chauffage performant
  if (owned.has("pac_air_eau")) score -= 20;
  if (owned.has("pac_air_air")) score -= 10;
  if (owned.has("poele_granules")) score -= 8;
  if (owned.has("chaudiere_biomasse")) score -= 12;

  // Solaire
  if (owned.has("panneaux_solaires_pv")) score -= 6;
  if (owned.has("panneaux_solaires_pv_batterie")) score -= 10;
  if (owned.has("solaire_thermique")) score -= 5;

  // Isolation
  if (owned.has("isolation_combles")) score -= 8;
  if (owned.has("isolation_murs_ite")) score -= 12;
  if (owned.has("isolation_murs_iti")) score -= 7;
  if (owned.has("isolation_plancher_bas")) score -= 5;
  if (owned.has("isolation_toiture")) score -= 8;
  if (owned.has("menuiseries_double_vitrage")) score -= 4;

  // ECS / Ventilation
  if (owned.has("chauffe_eau_thermodynamique")) score -= 4;
  if (owned.has("vmc_double_flux")) score -= 4;
  if (owned.has("thermostat_connecte")) score -= 2;

  // Pénalité maison très grande sans isolation
  if (surface && surface > 150 && !owned.has("isolation_combles") && !owned.has("isolation_murs_ite")) {
    score += 8;
  }

  if (score <= 10) return "A";
  if (score <= 20) return "B";
  if (score <= 35) return "C";
  if (score <= 50) return "D";
  if (score <= 65) return "E";
  if (score <= 80) return "F";
  return "G";
}

export const DPE_COLORS: Record<DpeGrade, string> = {
  A: "bg-emerald-500 text-white",
  B: "bg-green-500 text-white",
  C: "bg-lime-500 text-white",
  D: "bg-yellow-500 text-foreground",
  E: "bg-orange-500 text-white",
  F: "bg-red-500 text-white",
  G: "bg-red-700 text-white",
};
