import { describe, expect, it } from "vitest";
import { simuler } from "@/lib/solar-engine";

/**
 * Dimensionnement orienté AUTOCONSOMMATION (70 % de la conso sans batterie,
 * 100 % avec, plancher 3 kWc) + modèle diurne d'autoconsommation :
 * part diurne 60 % (85 % avec batterie) × rendement intra-journalier 0,88.
 */

/** Sans batterie : territoire, facture, kWc, production, autoconso %, couverture %, gains/an, part revente %, ROI. */
const SANS: [string, number, number, number, number, number, number, number, number][] = [
  ["martinique", 180, 3, 4719, 88, 41, 891, 12, 7.1],
  ["guadeloupe", 200, 3, 4638, 88, 35, 872, 12, 7.0],
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
      // Contrôle : production ≤ 70 % de la conso, sauf plancher 3 kWc
      if (!s.plancher) expect(s.productionAnnuelleKwh).toBeLessThanOrEqual(0.7 * r.consoAnnuelleKwh);
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

describe("plancher catalogue 3 kWc", () => {
  it("consommation modeste → 3 kWc et drapeau plancher", () => {
    const r = simuler({ territoireId: "corse", factureMensuelleTTC: 100 });
    if (r.statut !== "OK") throw new Error("statut inattendu");
    expect(r.sans.puissanceKwc).toBe(3);
    expect(r.sans.plancher).toBe(true);
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
  it("le taux avec batterie est toujours ≥ sans batterie", () => {
    const r = simuler({ territoireId: "martinique", factureMensuelleTTC: 180 });
    if (r.statut !== "OK") throw new Error("statut inattendu");
    expect(r.avec.tauxAutoconsoPct).toBeGreaterThanOrEqual(r.sans.tauxAutoconsoPct);
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
