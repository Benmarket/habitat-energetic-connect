import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { buildSolarCsv, buildSolarPdf, prepareSolarExport, solarCsvCell, type SolarSimulationRow } from '../lib/solar-simulation-export';
const row: SolarSimulationRow = {
  reference: 'SIM-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', created_at: '2026-11-19T12:55:02Z', lead_id: null,
  first_name: null, last_name: null, email: null, phone: null,
  snapshot: { version: 1, inputs: { city: 'Saint-Laurent-du-Maroni', postalCode: '97320', monthlyBill: 150 },
    engine: { territoire: 'Guyane', sans: { puissanceKwc: 3, economiesAn: 860, gains25ans: 20000 }, avec: { puissanceKwc: 3, economiesAn: 869, gains25ans: 23000 } }, comparisons: [] },
};
describe('Exports des simulations conservées', () => {
  it('exports the exact stored results and raw snapshot without mutation', () => {
    const before = JSON.stringify(row);
    const csv = buildSolarCsv([row]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"snapshot.engine.sans.economiesAn"');
    expect(csv).toContain('"860"'); expect(csv).toContain('"869"');
    expect(csv).toContain(JSON.stringify(row.snapshot).replace(/"/g, '""'));
    expect(JSON.stringify(row)).toBe(before);
  });
  it('escapes separators, quotes, accented text and dangerous spreadsheet formulas', () => {
    expect(solarCsvCell('Émilie; "test"')).toBe('"Émilie; ""test"""');
    expect(solarCsvCell('=HYPERLINK("bad")')).toBe('"\'=HYPERLINK(""bad"")"');
    expect(solarCsvCell(' +123')).toBe('"\' +123"');
    expect(solarCsvCell(-12)).toBe('"-12"');
  });
  it('creates a valid multi-page PDF from complete stored data including long fields', async () => {
    const before = JSON.stringify(row);
    const bytes = await buildSolarPdf({ ...row, snapshot: { ...row.snapshot, note: 'Électricité ☀️ '.repeat(800) } });
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(1);
    expect(pdf.getTitle()).toContain(row.reference);
    expect(JSON.stringify(row)).toBe(before);
  });
  it('packages exactly one PDF per selected simulation and one CSV', async () => {
    const second = { ...row, reference: 'SIM-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB' };
    const output = await prepareSolarExport([row, second], 'both');
    const zip = await JSZip.loadAsync(await output.blob.arrayBuffer());
    expect(Object.keys(zip.files).sort()).toEqual([
      `${row.reference}.pdf`, `${second.reference}.pdf`, 'simulations-solaires-2.csv',
    ].sort());
    const csv = await zip.file('simulations-solaires-2.csv')?.async('string');
    expect(csv).toContain(row.reference); expect(csv).toContain(second.reference);
  });
  it('downloads a single PDF directly and rejects an empty selection', async () => {
    const result = await prepareSolarExport([row], 'pdf');
    expect(result.filename).toBe(`${row.reference}.pdf`);
    expect(result.blob.type).toBe('application/pdf');
    await expect(prepareSolarExport([], 'csv')).rejects.toThrow('Aucune simulation sélectionnée');
  });
});
