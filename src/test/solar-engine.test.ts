import { describe, expect, it } from "vitest";
import { simuler, comparerConfigurations } from "@/lib/solar-engine";

/**
 * Dimensionnement : cible 100 % de la consommation annuelle, IDENTIQUE avec et
 * sans batterie (la batterie ne change que le taux d'autoconsommation),
 * plancher 3 kWc. Modèle diurne d'autoconsommation : part diurne 60 %
 * (85 % avec batterie) × rendement intra-journalier 0,88.
 */

/** Sans batterie : territoire, facture, kWc, production, autoconso %, couverture %, gains/an, part revente %, ROI. */
const SANS: [string, number, number, number, number, number, number, number, number][] = [
  ["martinique", 180, 6, 9438, 57, 53, 1704, 40, 6.0],
  ["guadeloupe", 200, 6, 9276, 66, 53, 1689, 32, 5.9],
  ["reunion", 150, 3, 4464, 88, 47, 860, 11, 3.8],
  ["corse", 100, 3, 4299, 69, 53, 767, 30, 7.9],
  ["guyane", 100, 3, 4218, 67, 53, 792, 32, 5.8],
  ["martinique", 100, 3, 4719, 60, 53, 881, 39, 7.3],
];

describe("sans batterie — valeurs de contrôle", () => {
  it.each(SANS)(
    "%s / %i €",
    (id, facture, kwc, prod, autoconso, couverture, gains, partRevente, roi) => {
      const r = simuler({ territoireId: id, factureMensuelleTTC: facture });
      if (r.statut !== "OK") throw new Error("statut inattendu");
      const s = r.sans;
      expect(s.puissanceKwc).toBe(kwc);
      expect(Math.abs(s.productionAnnuelleKwh - prod)).toBeLessThanOrEqual(3);
      expect(s.tauxAutoconsoPct).toBe(autoconso);
      expect(s.couvertureBesoinsPct).toBe(couverture);
      expect(Math.abs(s.economiesAn - gains)).toBeLessThanOrEqual(3);
      expect(s.partReventeDansGains).toBe(partRevente);
      expect(s.rentabiliteAns).toBeCloseTo(roi, 1);
      // Contrôle : production ≤ 100 % de la conso, sauf plancher 3 kWc
      if (!s.plancher) expect(s.productionAnnuelleKwh).toBeLessThanOrEqual(r.consoAnnuelleKwh);
    },
  );
});

/** Avec batterie : territoire, facture, kWc, autoconso %, couverture %, gains/an, part revente %, nouvelle facture €/mois. */
const AVEC: [string, number, number, number, number, number, number, number][] = [
  ["martinique", 180, 6, 81, 75, 1751, 17, 59],
  ["guadeloupe", 200, 6, 88, 71, 1729, 11, 72],
  ["martinique", 100, 3, 86, 75, 890, 14, 36],
  ["guyane", 100, 3, 88, 70, 799, 12, 41],
];

describe("avec batterie — valeurs de contrôle", () => {
  it.each(AVEC)(
    "%s / %i €",
    (id, facture, kwc, autoconso, couverture, gains, partRevente, factureMois) => {
      const r = simuler({ territoireId: id, factureMensuelleTTC: facture });
      if (r.statut !== "OK") throw new Error("statut inattendu");
      const s = r.avec;
      expect(s.puissanceKwc).toBe(kwc);
      expect(s.tauxAutoconsoPct).toBe(autoconso);
      expect(s.couvertureBesoinsPct).toBe(couverture);
      expect(Math.abs(s.economiesAn - gains)).toBeLessThanOrEqual(3);
      expect(s.partReventeDansGains).toBe(partRevente);
      expect(s.nouvelleFactureMensuelle).toBe(factureMois);
      // Contrôle : production ≤ 100 % de la conso, sauf plancher 3 kWc
      if (!s.plancher) expect(s.productionAnnuelleKwh).toBeLessThanOrEqual(r.consoAnnuelleKwh);
    },
  );
});

describe("dimensionnement — contrôle clé", () => {
  it.each([
    ["martinique", 180, 6],
    ["guadeloupe", 200, 6],
    ["martinique", 100, 3],
    ["reunion", 150, 3],
    ["corse", 100, 3],
    ["guyane", 200, 6],
  ] as const)("%s / %i € → %i kWc, identique avec et sans batterie", (id, facture, kwc) => {
    const r = simuler({ territoireId: id, factureMensuelleTTC: facture });
    if (r.statut !== "OK") throw new Error("statut inattendu");
    expect(r.sans.puissanceKwc).toBe(kwc);
    expect(r.avec.puissanceKwc).toBe(kwc);
    // La puissance recommandée ne doit JAMAIS dépendre de la batterie.
    expect(r.avec.puissanceKwc).toBe(r.sans.puissanceKwc);
  });
});

/** Ordre d'affichage : configuration au meilleur gain net 25 ans en premier. */
const ORDRE: [string, number, number, boolean][] = [
  ["guadeloupe", 200, 6, true], // batterie gagne (+1 694 €)
  ["martinique", 100, 3, true], // batterie gagne (+1 929 €)
  ["martinique", 180, 6, true], // batterie gagne (45 524 € vs 39 261 €)
  ["reunion", 150, 3, false], // sans batterie gagne (−2 910 €)
  ["corse", 100, 3, false], // sans batterie gagne (−1 358 €)
  ["guyane", 200, 6, false], // sans batterie gagne
];

describe("ordre d'affichage — batterieAvantageuse", () => {
  it.each(ORDRE)("%s / %i € → %i kWc, batterie mise en avant : %s", (id, facture, kwc, batAvantageuse) => {
    const r = simuler({ territoireId: id, factureMensuelleTTC: facture });
    if (r.statut !== "OK") throw new Error("statut inattendu");
    expect(r.puissanceKwc).toBe(kwc);
    expect(r.batterieAvantageuse).toBe(batAvantageuse);
    expect(r.gainNet25Avec > r.gainNet25Sans).toBe(batAvantageuse);
  });

  it("Martinique 180 € : gains nets 25 ans de contrôle", () => {
    const r = simuler({ territoireId: "martinique", factureMensuelleTTC: 180 });
    if (r.statut !== "OK") throw new Error("statut inattendu");
    expect(Math.abs(r.gainNet25Sans - 39261)).toBeLessThanOrEqual(150);
    expect(Math.abs(r.gainNet25Avec - 45524)).toBeLessThanOrEqual(150);
  });
});

describe("plancher catalogue 3 kWc", () => {
  it("consommation modeste → 3 kWc et drapeau plancher", () => {
    const r = simuler({ territoireId: "corse", factureMensuelleTTC: 40 });
    if (r.statut !== "OK") throw new Error("statut inattendu");
    expect(r.sans.puissanceKwc).toBe(3);
    expect(r.sans.plancher).toBe(true);
    expect(r.avec.plancher).toBe(true);
  });
  it("consommation confortable → pas de plancher", () => {
    const r = simuler({ territoireId: "martinique", factureMensuelleTTC: 250 });
    if (r.statut !== "OK") throw new Error("statut inattendu");
    expect(r.sans.plancher).toBe(false);
  });
});

describe("modèle diurne — bornes du taux", () => {
  it("plafonne à 88 % quand la production est très inférieure à la part diurne", () => {
    const r = simuler({ territoireId: "reunion", factureMensuelleTTC: 400 });
    if (r.statut !== "OK") throw new Error("statut inattendu");
    expect(r.sans.tauxAutoconsoPct).toBeLessThanOrEqual(88);
    expect(r.avec.tauxAutoconsoPct).toBeLessThanOrEqual(88);
  });
});

describe("décomposition — Martinique 180 €/mois, sans batterie", () => {
  it("somme des sous-lignes mensuelles", () => {
    const r = simuler({ territoireId: "martinique", factureMensuelleTTC: 180 });
    if (r.statut !== "OK") throw new Error("statut inattendu");
    const s = r.sans;
    expect(Math.abs(s.gainsMensuelsAutoconso + s.gainsMensuelsRevente - s.gainsMensuels)).toBeLessThanOrEqual(1);
    expect(s.nbPanneaux).toBeGreaterThan(0);
  });
});

/** Tableau comparatif — Martinique, 180 €/mois, orientation Sud (référence). */
const TABLE_MQ180: [number, boolean, number, number, number, number, number, number, number, number, number][] = [
  // kWc, batterie, production, % conso, couverture, gains/an, part revente, prix, reste, rentabilité, facture
  [3, false, 4719, 46, 41, 891, 12, 11900, 6770, 7.1, 114],
  [3, true, 4719, 46, 41, 891, 12, 12900, 7770, 8.1, 114],
  [6, false, 9438, 92, 53, 1704, 40, 16900, 10660, 6.0, 95],
  [6, true, 9438, 92, 75, 1751, 17, 17900, 11660, 6.3, 59],
  [9, false, 14157, 138, 53, 2498, 59, 19900, 10540, 4.2, 95],
  [9, true, 14157, 138, 75, 2546, 43, 21900, 12540, 4.8, 59],
];

describe("comparerConfigurations — Martinique 180 €/mois, Sud", () => {
  const rows = comparerConfigurations({ territoireId: "martinique", factureMensuelleTTC: 180, orientation: "S" });
  if (!rows) throw new Error("tableau absent");

  it("6 lignes : 3 puissances × 2 variantes (9 kWc sous le plafond de 140 %)", () => {
    expect(rows).toHaveLength(6);
  });

  it.each(TABLE_MQ180)(
    "%i kWc %s",
    (kwc, bat, prod, pctConso, couverture, gains, partRevente, prix, reste, roi, facture) => {
      const row = rows.find((r) => r.kwc === kwc && r.batterie === bat);
      if (!row) throw new Error(`ligne ${kwc} kWc ${bat ? "avec" : "sans"} absente`);
      expect(Math.abs(row.productionAnnuelleKwh - prod)).toBeLessThanOrEqual(3);
      expect(Math.abs(row.productionPctConso - pctConso)).toBeLessThanOrEqual(1);
      expect(row.couvertureBesoinsPct).toBe(couverture);
      expect(Math.abs(row.economiesAn - gains)).toBeLessThanOrEqual(3);
      expect(row.partReventeDansGains).toBe(partRevente);
      expect(row.prixTTC).toBe(prix);
      expect(row.resteACharge).toBe(reste);
      expect(row.rentabiliteAns).toBeCloseTo(roi, 1);
      expect(row.nouvelleFactureMensuelle).toBe(facture);
    },
  );

  it("gain net 25 ans : le 6 kWc avec batterie passe en premier", () => {
    const sans6 = rows.find((r) => r.kwc === 6 && !r.batterie);
    const avec6 = rows.find((r) => r.kwc === 6 && r.batterie);
    expect(Math.abs((sans6?.gainNet25ans ?? 0) - 39261)).toBeLessThanOrEqual(150);
    expect(Math.abs((avec6?.gainNet25ans ?? 0) - 45524)).toBeLessThanOrEqual(150);
  });
});

describe("comparerConfigurations — filtre 140 % de la consommation", () => {
  it("consommation modeste : seules les lignes 3 kWc (toujours affichées)", () => {
    const rows = comparerConfigurations({ territoireId: "corse", factureMensuelleTTC: 100, orientation: "S" });
    if (!rows) throw new Error("tableau absent");
    expect(rows.map((r) => r.kwc)).toEqual([3, 3]);
  });
  it("facture hors bornes → null", () => {
    expect(comparerConfigurations({ territoireId: "martinique", factureMensuelleTTC: 10 })).toBeNull();
  });
});

describe("cas limites", () => {
  it("facture trop basse", () => {
    const r = simuler({ territoireId: "martinique", factureMensuelleTTC: 10 });
    expect(r.statut).toBe("CONTACT");
    expect((r as any).raison).toBe("facture_hors_bornes");
  });
  it("facture trop haute", () => {
    const r = simuler({ territoireId: "martinique", factureMensuelleTTC: 900 });
    expect(r.statut).toBe("CONTACT");
    expect((r as any).raison).toBe("facture_hors_bornes");
  });
  it("territoire inconnu", () => {
    expect(() => simuler({ territoireId: "inconnu", factureMensuelleTTC: 150 })).toThrow();
  });
});
