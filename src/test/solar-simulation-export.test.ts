import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { getSolarReportState, solarSummary } from '../lib/solar-archived-report';
import { buildSolarCsv, prepareSolarExport, solarCsvCell, type SolarSimulationRow } from '../lib/solar-simulation-export';
const row: SolarSimulationRow = {
  reference: 'SIM-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', created_at: '2026-11-19T12:55:02Z', lead_id: null,
  first_name: null, last_name: null, email: null, phone: null,
  snapshot: { version: 1, inputs: { city: 'Saint-Laurent-du-Maroni', postalCode: '97320', monthlyBill: 150 },
    engine: { territoire: 'Guyane', territoireId: 'guyane', configRecommandee: { batterie: false }, sans: { puissanceKwc: 3, economiesAn: 860, gains25ans: 20000 }, avec: { puissanceKwc: 3, economiesAn: 869, gains25ans: 23000 } }, comparisons: [] },
};
describe('Exports des simulations conservées', () => {
  it('exports the exact stored results and raw snapshot without mutation', () => {
    const before = JSON.stringify(row);
    const csv = buildSolarCsv([row]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Sans batterie — Gains (€/an)"');
    expect(csv).toContain('"860"'); expect(csv).toContain('"869"');
    expect(csv).not.toContain('snapshot');
    expect(csv).not.toContain('snapshot_json');
    expect(JSON.stringify(row)).toBe(before);
  });
  it('escapes separators, quotes, accented text and dangerous spreadsheet formulas', () => {
    expect(solarCsvCell('Émilie; "test"')).toBe('"Émilie; ""test"""');
    expect(solarCsvCell('=HYPERLINK("bad")')).toBe('"\'=HYPERLINK(""bad"")"');
    expect(solarCsvCell(' +123')).toBe('"\' +123"');
    expect(solarCsvCell(-12)).toBe('"-12"');
  });
  it('keeps Corsica results and signals a genuinely mismatched stored territory', () => {
    const corsica = { ...row, snapshot: { ...row.snapshot, inputs: { postalCode: '20000', city: 'Ajaccio' }, engine: { ...row.snapshot.engine, territoireId: 'corse', territoire: 'Corse' } } };
    expect(getSolarReportState(corsica).mismatch).toBe(false);
    expect(solarSummary(corsica)['Territoire du calcul']).toBe('Corse');
    expect(buildSolarCsv([corsica])).not.toContain('Guyane');
    const wrong = { ...corsica, snapshot: { ...corsica.snapshot, engine: row.snapshot.engine } };
    expect(getSolarReportState(wrong).mismatch).toBe(true);
    expect(getSolarReportState(wrong).engine.sans.economiesAn).toBe(860);
  });
  it('replays saved battery and optimal scenarios without calculating new values', () => {
    const source = { ...row, snapshot: { ...row.snapshot, optimal: { ...row.snapshot.engine, sans: { economiesAn: 999 } } } };
    expect(getSolarReportState(source, false, true).scenario.economiesAn).toBe(869);
    expect(getSolarReportState(source, true, false).scenario.economiesAn).toBe(999);
    const mismatched = { ...source, snapshot: { ...source.snapshot, optimal: { territoireId: 'corse' } } };
    expect(getSolarReportState(mismatched, true).scenario.economiesAn).toBe(860);
  });
  it('packages exactly one PDF per selected simulation and one CSV', async () => {
    const second = { ...row, reference: 'SIM-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' };
    const output = await prepareSolarExport([row, second], 'both', testPdf);
    const zip = await JSZip.loadAsync(await output.blob.arrayBuffer());
    expect(Object.keys(zip.files).sort()).toEqual([
      `${row.reference}.pdf`, `${second.reference}.pdf`, 'simulations-solaires-2.csv',
    ].sort());
    const csv = await zip.file('simulations-solaires-2.csv')?.async('string');
    expect(csv).toContain(row.reference); expect(csv).toContain(second.reference);
  });
  it('downloads a single PDF directly and rejects an empty selection', async () => {
    const result = await prepareSolarExport([row], 'pdf', testPdf);
    expect(result.filename).toBe(`${row.reference}.pdf`);
    expect(result.blob.type).toBe('application/pdf');
    await expect(prepareSolarExport([], 'csv')).rejects.toThrow('Aucune simulation sélectionnée');
  });
});

async function testPdf() { const pdf = await PDFDocument.create(); pdf.addPage(); return pdf.save(); }
