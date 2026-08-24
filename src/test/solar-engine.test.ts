import { describe, expect, it } from "vitest";
import { simuler } from "@/lib/solar-engine";

/**
 * Dimensionnement orienté AUTOCONSOMMATION.
 * Cible = 70 % de la consommation sans batterie, 100 % avec batterie.
 * La production ne dépasse jamais la cible, sauf plancher catalogue de 3 kWc.
 */

/** Sans batterie : territoire, facture, conso, kWc, production, % conso, part revente, gains/an, ROI. */
const SANS: [string, number, number, number, number, number, number, number, number][] = [
  ["corse", 100, 5586, 3, 4299, 77, 43, 758, 8.1],
  ["corse", 200, 11890, 3, 4299, 36, 22, 773, 7.8],
  ["martinique", 100, 5403, 3, 4719, 87, 49, 877, 7.4],
  ["martinique", 250, 14665, 6, 9438, 64, 35, 1714, 6.0],
  ["guyane", 150, 8464, 3, 4218, 50, 29, 793, 5.8],
  ["reunion", 200, 11209, 3, 4464, 40, 23, 850, 3.9],
];

describe("dimensionnement — sans batterie", () => {
  it.each(SANS)(
    "%s / %i €",
    (id, facture, conso, kwc, prod, pctConso, partRevente, gains, roi) => {
      const r = simuler({ territoireId: id, factureMensuelleTTC: facture });
      if (r.statut !== "OK") throw new Error("statut inattendu");
      const s = r.sans;
      expect(r.consoAnnuelleKwh).toBeCloseTo(conso, -1);
      expect(s.puissanceKwc).toBe(kwc);
      expect(Math.abs(s.productionAnnuelleKwh - prod)).toBeLessThanOrEqual(3);
      expect(Math.round((s.productionAnnuelleKwh / r.consoAnnuelleKwh) * 100)).toBe(pctConso);
      expect(s.partReventeDansGains).toBe(partRevente);
      expect(Math.abs(s.economiesAn - gains)).toBeLessThanOrEqual(3);
      expect(s.rentabiliteAns).toBeCloseTo(roi, 1);
      // Contrôle : production ≤ 70 % de la conso, sauf plancher 3 kWc
      if (!s.plancher) expect(s.productionAnnuelleKwh).toBeLessThanOrEqual(0.7 * r.consoAnnuelleKwh);
      // Contrôle : la revente reste un bonus (< 35 %), sauf plancher
      if (!s.plancher) expect(s.partReventeDansGains).toBeLessThan(35);
    },
  );
});

/** Avec batterie : territoire, facture, kWc, production, % conso, part revente, besoins couverts, gains/an. */
const AVEC: [string, number, number, number, number, number, number, number][] = [
  ["martinique", 100, 3, 4719, 87, 22, 67, 887],
  ["martinique", 200, 6, 9438, 82, 19, 65, 1748],
  ["guyane", 100, 3, 4218, 79, 19, 64, 797],
  ["reunion", 200, 6, 8928, 80, 17, 64, 1684],
  ["corse", 200, 6, 8598, 72, 15, 60, 1533],
];

describe("dimensionnement — avec batterie", () => {
  it.each(AVEC)(
    "%s / %i €",
    (id, facture, kwc, prod, pctConso, partRevente, couverture, gains) => {
      const r = simuler({ territoireId: id, factureMensuelleTTC: facture });
      if (r.statut !== "OK") throw new Error("statut inattendu");
      const s = r.avec;
      expect(s.puissanceKwc).toBe(kwc);
      expect(Math.abs(s.productionAnnuelleKwh - prod)).toBeLessThanOrEqual(3);
      expect(Math.round((s.productionAnnuelleKwh / r.consoAnnuelleKwh) * 100)).toBe(pctConso);
      expect(s.partReventeDansGains).toBe(partRevente);
      expect(s.couvertureBesoinsPct).toBe(couverture);
      expect(Math.abs(s.economiesAn - gains)).toBeLessThanOrEqual(3);
      expect(s.productionAnnuelleKwh).toBeLessThanOrEqual(r.consoAnnuelleKwh);
      expect(s.partReventeDansGains).toBeLessThan(25);
    },
  );
});

describe("plancher catalogue 3 kWc", () => {
  it("consommation modeste → 3 kWc et drapeau plancher", () => {
    const r = simuler({ territoireId: "corse", factureMensuelleTTC: 100 });
    if (r.statut !== "OK") throw new Error("statut inattendu");
    expect(r.sans.puissanceKwc).toBe(3);
    expect(r.sans.plancher).toBe(true);
  });
  it("consommation confortable → pas de plancher", () => {
    const r = simuler({ territoireId: "corse", factureMensuelleTTC: 200 });
    if (r.statut !== "OK") throw new Error("statut inattendu");
    expect(r.sans.plancher).toBe(false);
  });
});

describe("décomposition — Martinique 250 €/mois, sans batterie", () => {
  it("somme des sous-lignes mensuelles", () => {
    const r = simuler({ territoireId: "martinique", factureMensuelleTTC: 250 });
    if (r.statut !== "OK") throw new Error("statut inattendu");
    const s = r.sans;
    expect(Math.abs(s.gainsMensuelsAutoconso + s.gainsMensuelsRevente - s.gainsMensuels)).toBeLessThanOrEqual(1);
    expect(s.nbPanneaux).toBeGreaterThan(0);
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
