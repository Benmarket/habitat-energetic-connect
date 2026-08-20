/**
 * SOURCE DE VÉRITÉ UNIQUE du simulateur. Aucune valeur tarifaire ailleurs.
 *
 * Primes & rachat outre-mer : arrêté du 5 janvier 2024 (« S24 PV ZNI »), période T9,
 *   demande de raccordement du 01/05/2026 au 31/07/2026. Source CRE open data.
 *   ⚠️ À rafraîchir chaque trimestre.
 * Métropole : arrêté du 6 octobre 2021 modifié par l'arrêté du 1er juin 2026 —
 *   prime supprimée, rachat unique 1,1 c€/kWh depuis le 05/06/2026.
 * Prix du kWh : tarif réglementé Bleu, option Base 6 kVA TTC au 01/08/2026.
 * Productible : API PVGIS v5.3 (base SARAH3), pertes 14 %, sur bâtiment.
 * Prix de vente : exports CRM du 20/08/2026, 1 595 dossiers 2026, tarif le plus
 *   fréquemment facturé (mode). Configurations sous 5 dossiers écartées.
 * CO₂ : Base Carbone ADEME.
 */

export type Seg = "p0_3" | "p3_9";
export type Kwc = 3 | 6 | 9;
export type RecoBatterie = "RENTABLE" | "CONFORT" | "OPTIONNELLE";

export interface Territoire {
  id: string;
  nom: string;
  zone: "ZNI" | "METROPOLE";
  actif: boolean; // false = pas de prix fiable, router vers le formulaire
  productible: number; // kWh produits par kWc et par an
  prixKwh: number; // € TTC / kWh consommé
  abo: number; // abonnement € TTC / an en 6 kVA
  co2: number; // kg CO₂ évités par kWh produit
  prime: Record<Seg, number>; // € par Watt-crête
  rachat: Record<Seg, number>; // € par kWh revendu
  prix: Record<Kwc, [number, number]>; // [sans batterie, avec batterie] € TTC
  panneaux: Record<Kwc, number>;
  batterie: {
    surcout: Record<Kwc, number>; // € TTC
    adoption: number | null; // part des ventes 2026 avec batterie
    reco: RecoBatterie;
  };
  alerte?: string;
}

const METRO_BASE = {
  zone: "METROPOLE" as const,
  actif: true,
  prixKwh: 0.2001,
  abo: 190.32,
  co2: 0.06,
  prime: { p0_3: 0, p3_9: 0 },
  rachat: { p0_3: 0.011, p3_9: 0.011 },
  prix: { 3: [9900, 13900], 6: [16900, 20900], 9: [19900, 23900] } as Record<Kwc, [number, number]>,
  panneaux: { 3: 6, 6: 12, 9: 18 } as Record<Kwc, number>,
  batterie: {
    surcout: { 3: 4000, 6: 4000, 9: 4000 } as Record<Kwc, number>,
    adoption: null,
    reco: "RENTABLE" as const,
  },
};

export const TERRITOIRES: Territoire[] = [
  // ═══ OUTRE-MER — prix issus des ventes réelles 2026 ═══
  {
    id: "martinique", nom: "Martinique", zone: "ZNI", actif: true, productible: 1573,
    prixKwh: 0.1896, abo: 175.56, co2: 0.84,
    prime: { p0_3: 1.72, p3_9: 1.04 }, rachat: { p0_3: 0.1804, p3_9: 0.1804 },
    prix: { 3: [11900, 12900], 6: [16900, 17900], 9: [19900, 21900] }, panneaux: { 3: 6, 6: 12, 9: 18 },
    batterie: { surcout: { 3: 1000, 6: 1000, 9: 2000 }, adoption: 0.77, reco: "CONFORT" },
  },
  {
    id: "guadeloupe", nom: "Guadeloupe", zone: "ZNI", actif: true, productible: 1546,
    prixKwh: 0.1889, abo: 175.56, co2: 0.702,
    prime: { p0_3: 1.79, p3_9: 1.09 }, rachat: { p0_3: 0.1804, p3_9: 0.1804 },
    prix: { 3: [11900, 13900], 6: [16900, 19900], 9: [19900, 23900] }, panneaux: { 3: 6, 6: 12, 9: 18 },
    batterie: { surcout: { 3: 2000, 6: 3000, 9: 4000 }, adoption: 0.46, reco: "CONFORT" },
  },
  {
    id: "guyane", nom: "Guyane", zone: "ZNI", actif: true, productible: 1406,
    prixKwh: 0.1905, abo: 187.53, co2: 0.35,
    prime: { p0_3: 1.69, p3_9: 1.02 }, rachat: { p0_3: 0.1804, p3_9: 0.1804 },
    prix: { 3: [9900, 13900], 6: [16900, 20900], 9: [19900, 24900] }, panneaux: { 3: 6, 6: 12, 9: 18 },
    batterie: { surcout: { 3: 4000, 6: 4000, 9: 5000 }, adoption: 0.07, reco: "OPTIONNELLE" },
    alerte: "Aucun dispositif de soutien dans les communes de Maripasoula et Papaichton.",
  },
  {
    id: "reunion", nom: "La Réunion", zone: "ZNI", actif: true, productible: 1488,
    prixKwh: 0.1948, abo: 173.16, co2: 0.78,
    prime: { p0_3: 1.55, p3_9: 0.93 }, rachat: { p0_3: 0.1756, p3_9: 0.1756 },
    prix: { 3: [7990, 10900], 6: [12990, 15900], 9: [19900, 19900] }, panneaux: { 3: 8, 6: 16, 9: 24 },
    batterie: { surcout: { 3: 2910, 6: 2910, 9: 0 }, adoption: 0.6, reco: "CONFORT" },
    alerte:
      "Prix hors dossiers avec aide régionale SPL, volontairement exclus. Le surcoût batterie en 9 kWc ressort à 0 € sur un échantillon faible (n=12 sans batterie) — à confirmer.",
  },
  {
    id: "corse", nom: "Corse", zone: "ZNI", actif: true, productible: 1433,
    prixKwh: 0.1834, abo: 175.56, co2: 0.45,
    prime: { p0_3: 1.15, p3_9: 0.65 }, rachat: { p0_3: 0.1661, p3_9: 0.1661 },
    prix: { 3: [9900, 12900], 6: [16900, 18900], 9: [18900, 21900] }, panneaux: { 3: 6, 6: 12, 9: 18 },
    batterie: { surcout: { 3: 3000, 6: 2000, 9: 3000 }, adoption: 0.1, reco: "OPTIONNELLE" },
  },

  // ═══ MÉTROPOLE — prime 0 €, rachat 1,1 c€/kWh depuis le 05/06/2026 ═══
  // ⚠️ Prix repris de la grille outre-mer faute d'historique de vente métropole. À ajuster.
  { id: "paca", nom: "Provence-Alpes-Côte d'Azur", productible: 1551, ...METRO_BASE },
  { id: "occitanie", nom: "Occitanie", productible: 1256, ...METRO_BASE },
  { id: "auvergne_rhone_alpes", nom: "Auvergne-Rhône-Alpes", productible: 1232, ...METRO_BASE },
  { id: "nouvelle_aquitaine", nom: "Nouvelle-Aquitaine", productible: 1222, ...METRO_BASE },
  { id: "pays_de_la_loire", nom: "Pays de la Loire", productible: 1173, ...METRO_BASE },
  { id: "bourgogne_franche_comte", nom: "Bourgogne-Franche-Comté", productible: 1148, ...METRO_BASE },
  { id: "centre_val_de_loire", nom: "Centre-Val de Loire", productible: 1118, ...METRO_BASE },
  { id: "bretagne", nom: "Bretagne", productible: 1107, ...METRO_BASE },
  { id: "ile_de_france", nom: "Île-de-France", productible: 1099, ...METRO_BASE },
  { id: "grand_est", nom: "Grand Est", productible: 1091, ...METRO_BASE },
  { id: "normandie", nom: "Normandie", productible: 1046, ...METRO_BASE },
  { id: "hauts_de_france", nom: "Hauts-de-France", productible: 1028, ...METRO_BASE },
];

export const HYP = {
  ratioDimensionnement: 0.7, // production cible en fraction de la consommation annuelle
  seuils: { vers3: 4.5, vers6: 7.5, vers9: 12 },
  inflationElec: 0.03, // par an
  degradation: 0.005, // par an
  horizonAns: 25,
  dureeRachatAns: 20, // le contrat d'achat du surplus s'arrête à 20 ans
  bascule9kVA: 9000, // kWh/an
  coefAbo9kVA: 1.25,
  factureMin: 20,
  factureMax: 800,
} as const;

/** Courbes du taux d'autoconsommation selon le ratio production / consommation. */
export const COURBES = {
  sansBatterie: [[0.2, 0.85], [0.4, 0.75], [0.6, 0.65], [0.8, 0.53], [1.0, 0.45], [1.5, 0.32], [2.0, 0.25]],
  avecBatterie: [[0.2, 0.95], [0.4, 0.92], [0.6, 0.88], [0.8, 0.8], [1.0, 0.72], [1.5, 0.52], [2.0, 0.4]],
} as const;

/** Département (2 ou 3 chiffres) → territoire. */
const DEPT_TO_TERRITOIRE: Record<string, string> = {};
const assign = (id: string, depts: (number | string)[]) =>
  depts.forEach((d) => {
    DEPT_TO_TERRITOIRE[typeof d === "number" ? String(d).padStart(2, "0") : d] = id;
  });

assign("ile_de_france", [75, 77, 78, 91, 92, 93, 94, 95]);
assign("hauts_de_france", [2, 59, 60, 62, 80]);
assign("grand_est", [8, 10, 51, 52, 54, 55, 57, 67, 68, 88]);
assign("normandie", [14, 27, 50, 61, 76]);
assign("bretagne", [22, 29, 35, 56]);
assign("pays_de_la_loire", [44, 49, 53, 72, 85]);
assign("centre_val_de_loire", [18, 28, 36, 37, 41, 45]);
assign("bourgogne_franche_comte", [21, 25, 39, 58, 70, 71, 89, 90]);
assign("nouvelle_aquitaine", [16, 17, 19, 23, 24, 33, 40, 47, 64, 79, 86, 87]);
assign("occitanie", [9, 11, 12, 30, 31, 32, 34, 46, 48, 65, 66, 81, 82]);
assign("auvergne_rhone_alpes", [1, 3, 7, 15, 26, 38, 42, 43, 63, 69, 73, 74]);
assign("paca", [4, 5, 6, 13, 83, 84]);
assign("corse", ["20", "2A", "2B"]);
assign("guadeloupe", ["971"]);
assign("martinique", ["972"]);
assign("guyane", ["973"]);
assign("reunion", ["974"]);

/** Retourne l'id de territoire pour un code postal français, ou null si non couvert. */
export function territoireFromPostal(postal: string): string | null {
  const p = (postal || "").trim();
  if (!/^\d{5}$/.test(p)) return null;
  const dom = p.slice(0, 3);
  if (DEPT_TO_TERRITOIRE[dom]) return DEPT_TO_TERRITOIRE[dom];
  if (p.startsWith("96") || p.startsWith("97") || p.startsWith("98") || p.startsWith("99")) return null;
  return DEPT_TO_TERRITOIRE[p.slice(0, 2)] ?? null;
}

export function getTerritoire(id: string | null | undefined): Territoire | null {
  return TERRITOIRES.find((t) => t.id === id) ?? null;
}
