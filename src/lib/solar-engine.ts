import {
  TERRITOIRES, HYP, AUTOCONSO, orientationPerfMap, bestOrientation,
  type Seg, type Kwc, type Territoire, type Orientation,
} from "./solar-data";

export interface Input {
  territoireId: string;
  factureMensuelleTTC: number;
  /** Orientation de toiture. Défaut : la meilleure orientation du territoire. */
  orientation?: Orientation | "";
}

export type SimulationResult = ReturnType<typeof simuler>;


/**
 * Taux d'autoconsommation selon le modèle diurne (cf. AUTOCONSO).
 * Les panneaux ne couvrent que la part diurne de la consommation ; au-delà,
 * toute la production est valorisée (taux plafonné par le rendement 0,88).
 *   ratio prod/conso 0,4 → 88 % · 0,8 → 66 % · 1,0 → 53 % · 1,5 → 35 % (sans batterie)
 */
function tauxAutoconsommation(production: number, conso: number, batterie: boolean): number {
  const d = batterie ? AUTOCONSO.partDiurneAvecBatterie : AUTOCONSO.partDiurneSansBatterie;
  const ratio = production / conso;
  return Math.min(1, d / ratio) * AUTOCONSO.rendementIntraJournalier;
}


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

  // ── ÉTAPE 0 · orientation → productible effectif ───────────────────────────
  // Le référentiel est le territoire : 100 % = meilleure orientation de la région.
  const perfMap = orientationPerfMap(t.id);
  const orientationRetenue: Exclude<Orientation, "?"> =
    input.orientation && input.orientation !== "?" ? input.orientation : bestOrientation(t.id);
  const scoreOrientation = perfMap[orientationRetenue];
  const coefOrientation = scoreOrientation / 100;
  const productibleEffectif = t.productible * coefOrientation;

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

  // ── ÉTAPE 2 · dimensionnement orienté AUTOCONSOMMATION ─────────────────────
  // Cible = fraction de la consommation annuelle. On retient la plus grande
  // puissance dont la production annuelle reste SOUS la cible. Jamais au-dessus.
  // La cible se calcule toujours sur le productible optimal du territoire :
  // une mauvaise orientation ne doit jamais débloquer une puissance supérieure.
  const dimensionner = (bat: boolean) => {
    const cible = (bat ? HYP.ratioCibleAvecBatterie : HYP.ratioCibleSansBatterie) * conso;
    const eligibles = ([3, 6, 9] as const).filter((p) => p * t.productible <= cible);
    return {
      kwc: (eligibles.length ? Math.max(...eligibles) : 3) as Kwc,
      plancher: eligibles.length === 0, // 3 kWc = plancher catalogue
    };
  };

  const dimSans = dimensionner(false);
  const dimAvec = dimensionner(true);

  const sans = scenario(t, conso, dimSans.kwc, false, abo, productibleEffectif);
  const avec = scenario(t, conso, dimAvec.kwc, true, abo, productibleEffectif);

  const surcout = avec.cout - sans.cout;
  const gainAnnuel = Math.round(avec.economiesAn - sans.economiesAn);
  const paybackBatterie = gainAnnuel > 0 ? Math.round(surcout / gainAnnuel) : null;

  return {
    statut: "OK" as const,
    territoireId: t.id,
    territoire: t.nom,
    zone: t.zone,
    consoAnnuelleKwh: Math.round(conso),
    orientation: orientationRetenue,
    scoreOrientation,
    orientationOptimale: bestOrientation(t.id),
    tarifRachatCts: Math.round(t.rachat[dimSans.kwc <= 3 ? "p0_3" : "p3_9"] * 10000) / 100,

    // ── Puissance recommandée (référence : scénario sans batterie) ──
    puissanceKwc: dimSans.kwc,
    nbPanneaux: t.panneaux[dimSans.kwc],
    puissanceKwcAvecBatterie: dimAvec.kwc,
    nbPanneauxAvecBatterie: t.panneaux[dimAvec.kwc],
    /** true = la consommation est inférieure à ce que produit un 3 kWc. */
    plancherApplique: dimSans.plancher,
    plancherAppliqueAvecBatterie: dimAvec.plancher,

    nouvelleFactureMensuelle: sans.nouvelleFactureMensuelle,
    sans: { ...sans, puissanceKwc: dimSans.kwc, nbPanneaux: t.panneaux[dimSans.kwc], plancher: dimSans.plancher },
    avec: { ...avec, puissanceKwc: dimAvec.kwc, nbPanneaux: t.panneaux[dimAvec.kwc], plancher: dimAvec.plancher },
    batterie: {
      surcout,
      gainAnnuel,
      paybackBatterie,
      adoption: t.batterie.adoption,
      reco: t.batterie.reco,
    },
    alerte: t.alerte ?? null,
    mentionTVA: t.mentionTVA,
  };
}


function scenario(t: Territoire, conso: number, kwc: Kwc, bat: boolean, abo: number, productible: number) {
  const seg: Seg = kwc <= 3 ? "p0_3" : "p3_9";
  const tarifRachat = t.rachat[seg];
  const productionAn1 = kwc * productible; // le productible PVGIS inclut déjà 14 % de pertes
  const plafond = kwc * HYP.plafondHeures; // au-delà, surplus racheté 5 c€/kWh

  const repartir = (prod: number) => {
    const taux = tauxAutoconsommation(prod, conso, bat);
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
    gainsMensuels: Math.round(economiesAn / 12),
    // Décomposition mensuelle du gain (facture évitée + revente nette d'impôt).
    // La somme des deux sous-lignes doit égaler `gainsMensuels` à 1 € d'arrondi près.
    gainsMensuelsAutoconso: Math.round(economieAutoconso / 12),
    gainsMensuelsRevente: Math.round((revenuAn1 - impotAn1) / 12),
    /**
     * Part de la revente du surplus dans les gains annuels (%).
     * Contrôle de dimensionnement : doit rester < 35 % sans batterie, < 25 % avec.
     */
    partReventeDansGains:
      economiesAn > 0 ? Math.round(((revenuAn1 - impotAn1) / economiesAn) * 100) : 0,

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
