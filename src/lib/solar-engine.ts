import { TERRITOIRES, HYP, COURBES, type Seg, type Kwc, type Territoire } from "./solar-data";

export interface Input {
  territoireId: string;
  factureMensuelleTTC: number;
}

export type SimulationResult = ReturnType<typeof simuler>;

export function simuler(input: Input) {
  const t = TERRITOIRES.find((x) => x.id === input.territoireId);
  if (!t) throw new Error(`Territoire inconnu : ${input.territoireId}`);
  if (!t.actif) return { statut: "CONTACT" as const, raison: "territoire_non_couvert" as const };
  if (input.factureMensuelleTTC < HYP.factureMin || input.factureMensuelleTTC > HYP.factureMax)
    return { statut: "CONTACT" as const, raison: "facture_hors_bornes" as const };

  // ── ÉTAPE 1 · facture mensuelle → consommation annuelle ────────────────────
  // La facture contient un abonnement fixe. Le retirer AVANT de diviser par le
  // prix du kWh, sinon on surestime la consommation.
  const factureAnnuelle = input.factureMensuelleTTC * 12;
  let abo = t.abo;
  let conso = Math.max(0, factureAnnuelle - abo) / t.prixKwh;
  if (conso > HYP.bascule9kVA) {
    abo = t.abo * HYP.coefAbo9kVA;
    conso = Math.max(0, factureAnnuelle - abo) / t.prixKwh;
  }

  // ── ÉTAPE 2 · dimensionnement (cible = 70 % de la consommation) ────────────
  const pTheorique = (conso * HYP.ratioDimensionnement) / t.productible;
  const kwc: Kwc | null =
    pTheorique < HYP.seuils.vers3 ? 3 :
    pTheorique < HYP.seuils.vers6 ? 6 :
    pTheorique < HYP.seuils.vers9 ? 9 : null;

  if (kwc === null)
    return { statut: "CONTACT" as const, raison: "puissance_hors_catalogue" as const, conso };

  // ── ÉTAPES 3 à 6 · les deux scénarios ──────────────────────────────────────
  const sans = scenario(t, conso, kwc, false);
  const avec = scenario(t, conso, kwc, true);

  const surcout = avec.cout - sans.cout;
  const gainAnnuel = Math.round(avec.economiesAn - sans.economiesAn);
  const paybackBatterie = gainAnnuel > 0 ? Math.round(surcout / gainAnnuel) : null;

  return {
    statut: "OK" as const,
    territoireId: t.id,
    territoire: t.nom,
    zone: t.zone,
    consoAnnuelleKwh: Math.round(conso),
    puissanceKwc: kwc,
    nbPanneaux: t.panneaux[kwc],
    nouvelleFactureMensuelle: Math.round(((conso - sans.autoconsommee) * t.prixKwh + abo) / 12),
    sans,
    avec,
    batterie: {
      surcout,
      gainAnnuel,
      paybackBatterie,
      adoption: t.batterie.adoption,
      reco: t.batterie.reco,
    },
    alerte: t.alerte ?? null,
  };
}

function scenario(t: Territoire, conso: number, kwc: Kwc, bat: boolean) {
  const seg: Seg = kwc <= 3 ? "p0_3" : "p3_9";
  const productionAn1 = kwc * t.productible; // le productible PVGIS inclut déjà 14 % de pertes

  const repartir = (prod: number) => {
    const taux = interp(bat ? COURBES.avecBatterie : COURBES.sansBatterie, prod / conso);
    const autoconsommee = Math.min(prod * taux, conso);
    return { autoconsommee, surplus: prod - autoconsommee, taux };
  };

  const r1 = repartir(productionAn1);

  // La prime est en €/Wc et s'applique à la TOTALITÉ de la puissance au taux du
  // segment. Ce n'est PAS un barème par tranches cumulatives.
  const AIDES = Math.round(kwc * 1000 * t.prime[seg]);
  const cout = t.prix[kwc][bat ? 1 : 0];
  const resteACharge = cout - AIDES;
  const economiesAn = r1.autoconsommee * t.prixKwh + r1.surplus * t.rachat[seg];

  let cumul = 0;
  let roi: number | null = null;
  for (let n = 1; n <= HYP.horizonAns; n++) {
    const prod = productionAn1 * Math.pow(1 - HYP.degradation, n - 1);
    const prixElec = t.prixKwh * Math.pow(1 + HYP.inflationElec, n - 1);
    const r = repartir(prod);
    const surplus = n <= HYP.dureeRachatAns ? r.surplus * t.rachat[seg] : 0;
    const gain = r.autoconsommee * prixElec + surplus;
    const avant = cumul;
    cumul += gain;
    if (roi === null && cumul >= resteACharge) roi = n - 1 + (resteACharge - avant) / gain;
  }

  return {
    cout,
    AIDES,
    resteACharge,
    economiesAn: Math.round(economiesAn),
    economies25ans: Math.round(cumul),
    rentabiliteAns: roi ? Math.round(roi * 10) / 10 : null,
    co2KgAn: Math.round(productionAn1 * t.co2),
    productionAnnuelleKwh: Math.round(productionAn1),
    autoconsommee: Math.round(r1.autoconsommee),
    surplus: Math.round(r1.surplus),
    tauxAutoconsoPct: Math.round(r1.taux * 100),
  };
}

function interp(courbe: readonly (readonly [number, number])[] | number[][], x: number): number {
  const c = courbe as number[][];
  if (x <= c[0][0]) return c[0][1];
  if (x >= c[c.length - 1][0]) return c[c.length - 1][1];
  for (let i = 0; i < c.length - 1; i++) {
    const [x1, y1] = c[i];
    const [x2, y2] = c[i + 1];
    if (x >= x1 && x <= x2) return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
  }
  return c[c.length - 1][1];
}
