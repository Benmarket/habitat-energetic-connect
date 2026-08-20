import { describe, expect, it } from "vitest";
import { simuler } from "@/lib/solar-engine";

/** Scénario B (celui affiché sur la carte d'aperçu) — tolérance ±3 €. */
const CAS_B: [string, number, number, number, number, number, number, number, number, number, number][] = [
  // territoire, facture, conso, kwc, prix, aides, reste, éco/an, roi, éco25, co2
  ["martinique", 75, 3821, 6, 16900, 6240, 10660, 1639, 6.4, 38848, 7928],
  ["reunion", 75, 3731, 6, 12990, 5520, 7470, 1532, 4.8, 36557, 6964],
  ["guyane", 75, 3740, 6, 16900, 6180, 10720, 1470, 7.2, 34862, 2953],
  ["martinique", 110, 6036, 9, 19900, 9360, 10540, 2458, 4.2, 58273, 11892],
  ["guadeloupe", 110, 6058, 9, 19900, 9810, 10090, 2413, 4.1, 57189, 9768],
  ["guyane", 110, 5945, 9, 19900, 9270, 10630, 2205, 4.8, 52619, 4429],
  ["corse", 110, 6240, 9, 18900, 5760, 13140, 2075, 6.2, 50145, 5804],
  ["reunion", 125, 6811, 9, 19900, 8280, 11620, 2300, 5.0, 56062, 10446],
  ["martinique", 180, 10235, 9, 19900, 9360, 10540, 2488, 4.2, 64038, 11892],
  ["guadeloupe", 250, 14720, 9, 19900, 9810, 10090, 2477, 4.0, 68134, 9768],
];

describe("scénario B — non-régression", () => {
  it.each(CAS_B)(
    "%s / %i €",
    (id, facture, conso, kwc, prix, aides, reste, ecoAn, roi, eco25, co2) => {
      const r = simuler({ territoireId: id, factureMensuelleTTC: facture });
      if (r.statut !== "OK") throw new Error("statut inattendu");
      const B = r.scenarioB;
      expect(r.consoAnnuelleKwh).toBeCloseTo(conso, -1);
      expect(B.puissanceKwc).toBe(kwc);
      expect(B.cout).toBe(prix);
      expect(B.AIDES).toBe(aides);
      expect(B.resteACharge).toBe(reste);
      expect(Math.abs(B.economiesAn - ecoAn)).toBeLessThanOrEqual(3);
      expect(B.rentabiliteAns).toBeCloseTo(roi, 1);
      expect(Math.abs(B.economies25ans - eco25)).toBeLessThanOrEqual(3);
      expect(Math.abs(B.co2KgAn - co2)).toBeLessThanOrEqual(3);
    },
  );
});

/** Scénario A et comparatif. */
const CAS_A: [string, number, number, number, number, number, number, boolean, number][] = [
  // territoire, facture, kwc, aides, éco/an, roi, gain net 25 ans, B plus rapide, gain net suppl.
  ["martinique", 75, 3, 5130, 873, 7.5, 15873, true, 12315],
  ["reunion", 75, 3, 4620, 823, 4.0, 18248, false, 10839],
  ["guyane", 75, 3, 5100, 783, 6.0, 15802, false, 8340],
  ["martinique", 110, 3, 5130, 879, 7.4, 18093, true, 29640],
  ["guadeloupe", 110, 3, 5400, 862, 7.2, 17990, true, 29109],
  ["reunion", 110, 3, 4620, 835, 4.0, 20596, false, 22619],
  ["corse", 110, 3, 3420, 761, 8.0, 15757, true, 21248],
  ["martinique", 180, 6, 6240, 1685, 6.1, 35918, true, 17580],
  ["guadeloupe", 250, 6, 6540, 1682, 5.9, 39604, true, 18440],
];

describe("scénario A et comparatif", () => {
  it.each(CAS_A)(
    "%s / %i €",
    (id, facture, kwc, aides, ecoAn, roi, gainNet, bPlusRapide, gainSuppl) => {
      const r = simuler({ territoireId: id, factureMensuelleTTC: facture });
      if (r.statut !== "OK") throw new Error("statut inattendu");
      const A = r.scenarioA;
      expect(A.puissanceKwc).toBe(kwc);
      expect(A.AIDES).toBe(aides);
      expect(Math.abs(A.economiesAn - ecoAn)).toBeLessThanOrEqual(3);
      expect(A.rentabiliteAns).toBeCloseTo(roi, 1);
      expect(Math.abs(A.economies25ans - A.resteACharge - gainNet)).toBeLessThanOrEqual(3);
      expect(r.comparatif.bPlusRapide).toBe(bPlusRapide);
      expect(Math.abs(r.comparatif.gainNetSupplementaire - gainSuppl)).toBeLessThanOrEqual(3);
    },
  );
});

describe("décomposition — Martinique 110 €/mois, scénario B", () => {
  const r = simuler({ territoireId: "martinique", factureMensuelleTTC: 110 });
  it("postes détaillés", () => {
    if (r.statut !== "OK") throw new Error("statut inattendu");
    const B = r.scenarioB;
    expect(Math.abs(B.economieAutoconso - 671)).toBeLessThanOrEqual(3);
    expect(Math.abs(B.revenuSurplusAn1 - 1935)).toBeLessThanOrEqual(3);
    expect(Math.abs(B.impotAnnuel - 148)).toBeLessThanOrEqual(3);
    expect(Math.abs(B.revenuSurplus20ans - 38318)).toBeLessThanOrEqual(3);
    expect(B.nbPanneaux).toBe(18);
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
