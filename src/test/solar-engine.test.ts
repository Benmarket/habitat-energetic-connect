import { describe, expect, it } from "vitest";
import { simuler } from "@/lib/solar-engine";

const CAS: [string, number, number, number, number, number, number, number, number, number, number][] = [
  // territoire, facture, conso, kwc, aides, prix, reste, eco/an, eco25, renta, co2
  ["martinique", 180, 10235, 6, 6240, 16900, 10660, 1744, 47097, 6.0, 7928],
  ["guadeloupe", 180, 10273, 6, 6540, 16900, 10360, 1712, 46372, 5.9, 6512],
  ["guyane", 180, 10108, 6, 6120, 16900, 10780, 1566, 43245, 6.7, 2953],
  ["corse", 180, 10581, 6, 3900, 16900, 13000, 1506, 42167, 8.3, 3869],
  ["reunion", 180, 9977, 6, 5580, 12990, 7410, 1652, 45241, 4.4, 6964],
  ["martinique", 110, 6036, 3, 5160, 11900, 6740, 875, 24522, 7.4, 3964],
  ["guyane", 110, 5945, 3, 5070, 9900, 4830, 786, 22504, 5.9, 1476],
  ["reunion", 110, 5887, 3, 4650, 7990, 3340, 831, 23660, 3.9, 3482],
  ["guyane", 260, 15147, 9, 9180, 19900, 10720, 2349, 64852, 4.5, 4429],
  ["corse", 260, 15815, 9, 5850, 18900, 13050, 2259, 63188, 5.6, 5804],
  ["paca", 150, 8044, 3, 0, 9900, 9900, 633, 21878, 13.3, 279],
  ["hauts_de_france", 150, 8044, 6, 0, 16900, 16900, 709, 24929, 18.6, 370],
  ["occitanie", 200, 10805, 6, 0, 16900, 16900, 926, 32397, 15.0, 452],
];

describe("simuler — non-régression", () => {
  it.each(CAS)(
    "%s / %i €",
    (id, facture, conso, kwc, aides, prix, reste, ecoAn, eco25, renta, co2) => {
      const r = simuler({ territoireId: id, factureMensuelleTTC: facture });
      if (r.statut !== "OK") throw new Error("statut inattendu");
      expect(r.consoAnnuelleKwh).toBeCloseTo(conso, -1);
      expect(r.puissanceKwc).toBe(kwc);
      expect(r.sans.AIDES).toBe(aides);
      expect(r.sans.cout).toBe(prix);
      expect(r.sans.resteACharge).toBe(reste);
      expect(Math.abs(r.sans.economiesAn - ecoAn)).toBeLessThanOrEqual(2);
      expect(Math.abs(r.sans.economies25ans - eco25)).toBeLessThanOrEqual(2);
      expect(r.sans.rentabiliteAns).toBeCloseTo(renta, 1);
      expect(Math.abs(r.sans.co2KgAn - co2)).toBeLessThanOrEqual(2);
    },
  );
});

describe("comparatif batterie", () => {
  const CAS_BAT: [string, number, number, number, number | null, string][] = [
    ["martinique", 180, 1000, 24, 42, "CONFORT"],
    ["guadeloupe", 180, 3000, 21, 143, "CONFORT"],
    ["guyane", 180, 4000, 23, 174, "OPTIONNELLE"],
    ["corse", 180, 2000, 40, 50, "OPTIONNELLE"],
    ["reunion", 180, 2910, 46, 63, "CONFORT"],
    ["hauts_de_france", 150, 4000, 307, 13, "RENTABLE"],
    ["occitanie", 200, 4000, 355, 11, "RENTABLE"],
  ];
  it.each(CAS_BAT)("%s / %i €", (id, facture, surcout, gain, payback, reco) => {
    const r = simuler({ territoireId: id, factureMensuelleTTC: facture });
    if (r.statut !== "OK") throw new Error("statut inattendu");
    expect(r.batterie.surcout).toBe(surcout);
    expect(Math.abs(r.batterie.gainAnnuel - gain)).toBeLessThanOrEqual(2);
    expect(r.batterie.paybackBatterie).toBe(payback);
    expect(r.batterie.reco).toBe(reco);
  });
});

describe("cas limites", () => {
  it("facture trop basse", () => {
    const r = simuler({ territoireId: "martinique", factureMensuelleTTC: 10 });
    expect(r.statut).toBe("CONTACT");
    expect((r as any).raison).toBe("facture_hors_bornes");
  });
  it("puissance hors catalogue", () => {
    const r = simuler({ territoireId: "martinique", factureMensuelleTTC: 600 });
    expect(r.statut).toBe("CONTACT");
    expect((r as any).raison).toBe("puissance_hors_catalogue");
  });
  it("territoire inconnu", () => {
    expect(() => simuler({ territoireId: "inconnu", factureMensuelleTTC: 150 })).toThrow();
  });
});
