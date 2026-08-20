import { TERRITOIRES, HYP, COURBES, type Seg, type Kwc, type Territoire } from "./solar-data";

export interface Input {
  territoireId: string;
  factureMensuelleTTC: number;
}

export type SimulationResult = ReturnType<typeof simuler>;

/**
 * Impôt annuel sur les revenus de revente.
 * ≤ 3 kWc : exonéré (art. 35 ter du CGI).
 * > 3 kWc : micro-BIC, abattement 71 %, puis IR au TMI de 11 % (hypothèse par
 * défaut, réduite par la réfaction outre-mer) + prélèvements sociaux à 18,6 %.
 */
function impotRevente(revenu: number, kwc: number, refactionIR: number): number {
  if (kwc <= 3) return 0;
  const baseImposable = revenu * 0.29; // après abattement de 71 %
  return baseImposable * (0.11 * (1 - refactionIR) + 0.186);
}

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

  // ── ÉTAPE 2 · les deux scénarios ───────────────────────────────────────────
  // Garde-fou interne (non affiché) : production ≤ 2,5 × consommation annuelle.
  const productionMax = HYP.productionMaxRatio * conso;
  const candidats = ([3, 6, 9] as const).filter((p) => p * t.productible <= productionMax);
  if (candidats.length === 0)
    return { statut: "CONTACT" as const, raison: "consommation_trop_faible" as const, conso };

  // A — l'essentiel : règle des 70 %, bornée aux candidats autorisés
  const pTheorique = (conso * HYP.ratioScenarioA) / t.productible;
  const kwcTheorique: Kwc = pTheorique < HYP.seuils.vers3 ? 3 : pTheorique < HYP.seuils.vers6 ? 6 : 9;
  const kwcA: Kwc = candidats.includes(kwcTheorique as never)
    ? kwcTheorique
    : candidats[candidats.length - 1];

  // B — le maximum : plus grand gain net sur 25 ans
  let kwcB: Kwc = kwcA;
  let meilleurGainNet = -Infinity;
  for (const p of candidats) {
    const s = scenario(t, conso, p, false, abo);
    const gainNet = s.economies25ans - s.resteACharge;
    if (gainNet > meilleurGainNet) {
      meilleurGainNet = gainNet;
      kwcB = p;
    }
  }

  const A = scenario(t, conso, kwcA, false, abo);
  const B = scenario(t, conso, kwcB, false, abo);
  const identiques = kwcA === kwcB;

  // Scénarios batterie (comparatif conservé, calé sur la puissance retenue B)
  const sans = B;
  const avec = scenario(t, conso, kwcB, true, abo);
  const surcout = avec.cout - sans.cout;
  const gainAnnuel = Math.round(avec.economiesAn - sans.economiesAn);
  const paybackBatterie = gainAnnuel > 0 ? Math.round(surcout / gainAnnuel) : null;

  return {
    statut: "OK" as const,
    territoireId: t.id,
    territoire: t.nom,
    zone: t.zone,
    consoAnnuelleKwh: Math.round(conso),
    tarifRachatCts: Math.round(t.rachat[kwcB <= 3 ? "p0_3" : "p3_9"] * 10000) / 100,

    // ── Les deux scénarios comparés ──
    scenarioA: { ...A, puissanceKwc: kwcA, nbPanneaux: t.panneaux[kwcA], libelle: "L'essentiel" },
    scenarioB: { ...B, puissanceKwc: kwcB, nbPanneaux: t.panneaux[kwcB], libelle: "Le maximum" },
    scenarioIdentiques: identiques,
    recommande: "B" as const,
    comparatif: {
      surcoutInitial: B.resteACharge - A.resteACharge,
      gainNetSupplementaire:
        B.economies25ans - B.resteACharge - (A.economies25ans - A.resteACharge),
      bPlusRapide: (B.rentabiliteAns ?? Infinity) <= (A.rentabiliteAns ?? Infinity),
    },

    // ── Compatibilité affichage existant (scénario B) ──
    puissanceKwc: kwcB,
    nbPanneaux: t.panneaux[kwcB],
    nouvelleFactureMensuelle: sans.nouvelleFactureMensuelle,
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

function scenario(t: Territoire, conso: number, kwc: Kwc, bat: boolean, abo: number) {
  const seg: Seg = kwc <= 3 ? "p0_3" : "p3_9";
  const tarifRachat = t.rachat[seg];
  const productionAn1 = kwc * t.productible; // le productible PVGIS inclut déjà 14 % de pertes
  const plafond = kwc * HYP.plafondHeures; // au-delà, surplus racheté 5 c€/kWh

  const repartir = (prod: number) => {
    const taux = interp(bat ? COURBES.avecBatterie : COURBES.sansBatterie, prod / conso);
    const autoconsommee = Math.min(prod * taux, conso);
    const surplus = prod - autoconsommee;
    return {
      autoconsommee,
      surplus,
      surplusTarifPlein: Math.min(surplus, plafond),
      surplusTarifReduit: Math.max(0, surplus - plafond),
      taux,
    };
  };

  const r1 = repartir(productionAn1);

  // La prime est en €/Wc et s'applique à la TOTALITÉ de la puissance au taux du
  // segment. Ce n'est PAS un barème par tranches cumulatives.
  const AIDES = Math.round(kwc * 1000 * t.prime[seg]);
  const cout = t.prix[kwc][bat ? 1 : 0];
  const resteACharge = cout - AIDES;

  const revenuAn1 = r1.surplusTarifPlein * tarifRachat + r1.surplusTarifReduit * HYP.tarifSurplusReduit;
  const impotAn1 = impotRevente(revenuAn1, kwc, t.refactionIR);
  const economieAutoconso = r1.autoconsommee * t.prixKwh;
  const economiesAn = economieAutoconso + revenuAn1 - impotAn1;

  let cumul = 0;
  let cumulRevente = 0;
  let cumulAutoconso = 0;
  let cumulImpot = 0;
  let roi: number | null = null;
  for (let n = 1; n <= HYP.horizonAns; n++) {
    const prod = productionAn1 * Math.pow(1 - HYP.degradation, n - 1);
    const prixElec = t.prixKwh * Math.pow(1 + HYP.inflationElec, n - 1);
    const tarifAnnee = tarifRachat * Math.pow(1 + HYP.indexationRachat, n - 1);
    const r = repartir(prod);
    const revente =
      n <= HYP.dureeRachatAns
        ? r.surplusTarifPlein * tarifAnnee + r.surplusTarifReduit * HYP.tarifSurplusReduit
        : 0;
    cumulRevente += revente;
    const impot = impotRevente(revente, kwc, t.refactionIR);
    cumulImpot += impot;
    const autoconso = r.autoconsommee * prixElec;
    cumulAutoconso += autoconso;
    const gain = autoconso + revente - impot;
    const avant = cumul;
    cumul += gain;
    if (roi === null && cumul >= resteACharge) roi = n - 1 + (resteACharge - avant) / gain;
  }

  const tauxPct = Math.round(r1.taux * 100);

  return {
    cout,
    AIDES,
    resteACharge,
    economiesAn: Math.round(economiesAn),
    economies25ans: Math.round(cumul),
    gains25ans: Math.round(cumul),
    gainNet25ans: Math.round(cumul - resteACharge),
    factureEvitee25ans: Math.round(cumulAutoconso),
    reventeNette25ans: Math.round(cumulRevente - cumulImpot),
    rentabiliteAns: roi ? Math.round(roi * 10) / 10 : null,
    co2KgAn: Math.round(productionAn1 * t.co2),
    productionAnnuelleKwh: Math.round(productionAn1),
    autoconsommee: Math.round(r1.autoconsommee),
    surplus: Math.round(r1.surplus),
    tauxAutoconsoPct: tauxPct,
    partAutoconsommeePct: tauxPct,
    partRevenduePct: 100 - tauxPct,
    couvertureBesoinsPct: Math.round((r1.autoconsommee / conso) * 100),
    nouvelleFactureMensuelle: Math.round(((conso - r1.autoconsommee) * t.prixKwh + abo) / 12),
    // Détail affiché sous chaque scénario
    economieAutoconso: Math.round(economieAutoconso),
    revenuSurplusAn1: Math.round(revenuAn1),
    impotAnnuel: Math.round(impotAn1),
    revenuSurplus20ans: Math.round(cumulRevente),
    tarifRachatCts: Math.round(tarifRachat * 10000) / 100,
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
