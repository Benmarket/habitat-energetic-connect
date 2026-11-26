import { solarSummary } from './solar-archived-report';
/** Export immutable reports only; never call the calculation engine here. */
export type SolarSimulationRow = {
  reference: string; created_at: string; lead_id: string | null;
  first_name: string | null; last_name: string | null; email: string | null; phone: string | null;
  ip_address?: string | null; user_agent?: string | null; device_type?: string | null; browser?: string | null;
  snapshot: Record<string, any>;
};
export type SolarExportFormat = 'csv' | 'pdf' | 'both';
export type PreparedSolarExport = { blob: Blob; filename: string };

export const SOLAR_INPUT_LABELS: Record<string, string> = {
  postalCode: 'Code postal', city: 'Ville', housing: 'Logement', surface: 'Surface (m²)',
  ownership: 'Propriétaire', orientation: 'Orientation', roofType: 'Toiture', equipments: 'Équipements',
  monthlyBill: 'Facture mensuelle (€)', householdSize: 'Personnes au foyer', projectHorizon: 'Délai',
  hasQuote: 'Devis reçu', batteryInterest: 'Intérêt batterie', territoireId: 'Territoire',
};
const RESULT_LABELS: Record<string, string> = {
  puissanceKwc: 'Puissance (kWc)', nbPanneaux: 'Nombre de panneaux', cout: 'Prix indicatif TTC (€)',
  AIDES: 'Aides estimées (€)', resteACharge: 'Reste à charge estimé (€)', economiesAn: 'Gains annuels (€)',
  gainsMensuels: 'Gains mensuels (€)', gainsMensuelsAutoconso: 'Gains mensuels autoconsommation (€)',
  gainsMensuelsRevente: 'Gains mensuels revente nette (€)', nouvelleFactureMensuelle: 'Facture estimée (€/mois)',
  couvertureBesoinsPct: 'Besoins couverts (%)', gains25ans: 'Gains cumulés sur 25 ans (€)',
  gainNet25ans: 'Gain net sur 25 ans (€)', economies25ans: 'Gains cumulés sur 25 ans (€)',
  factureEvitee25ans: 'Facture évitée sur 25 ans (€)', reventeNette25ans: 'Revente nette sur 25 ans (€)',
  tauxAutoconso: 'Taux d’autoconsommation (%)', productionAnnuelleKwh: 'Production annuelle (kWh)',
  consoAnnuelleKwh: 'Consommation annuelle estimée (kWh)', partReventeDansGains: 'Part revente dans les gains (%)',
  territoire: 'Territoire', zone: 'Zone', orientation: 'Orientation retenue', scoreOrientation: 'Score orientation',
  orientationOptimale: 'Orientation optimale', tarifRachatCts: 'Rachat (c€/kWh)', batterieAvantageuse: 'Batterie avantageuse',
  surcout: 'Surcoût batterie (€)', gainAnnuel: 'Gain annuel supplémentaire (€)', paybackBatterie: 'Retour batterie (ans)',
  mentionTVA: 'Mention TVA', alerte: 'Avertissement', roi: 'Retour sur investissement (ans)',
};
export const solarValueText = (value: unknown): string => {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (Array.isArray(value)) return value.map(solarValueText).join(', ') || '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

export function flattenSolarData(value: unknown, prefix = '', output: Record<string, unknown> = {}): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, entry] of Object.entries(value)) flattenSolarData(entry, prefix ? `${prefix}.${key}` : key, output);
  } else if (Array.isArray(value) && value.some(v => v && typeof v === 'object')) {
    value.forEach((entry, index) => flattenSolarData(entry, `${prefix}.${index + 1}`, output));
  } else output[prefix] = value;
  return output;
}

/** Quoting alone does not stop spreadsheet formulas from executing. */
export function solarCsvCell(value: unknown): string {
  let text = value == null ? '' : Array.isArray(value) ? value.join(', ') : String(value);
  if (typeof value !== 'number' && /^[\s]*[=+@\-]|^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function buildSolarCsv(rows: SolarSimulationRow[]): string {
  const records = rows.map(solarSummary);
  const columns = [...new Set(records.flatMap(record => Object.keys(record)))];
  return '\uFEFF' + [columns.map(solarCsvCell).join(';'), ...records.map(record =>
    columns.map(column => solarCsvCell((record as Record<string, unknown>)[column])).join(';'))].join('\r\n');
}

const safeFilename = (reference: string) => reference.replace(/[^a-zA-Z0-9_-]/g, '_');

export async function buildSolarPdf(row: SolarSimulationRow): Promise<Uint8Array> {
  const [{ PDFDocument }, { default: html2canvas }, { createRoot }, React, { default: SolarArchivedReport }] = await Promise.all([
    import('pdf-lib'), import('html2canvas-pro'), import('react-dom/client'), import('react'), import('@/components/SolarArchivedReport'),
  ]);
  const host = document.createElement('div');
  host.className = 'solar-archive-export-host';
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    const { flushSync } = await import('react-dom');
    flushSync(() => root.render(React.createElement(SolarArchivedReport, { row, exportMode: true })));
    await document.fonts.ready;
    await Promise.all(Array.from(host.querySelectorAll('img')).map(async image => {
      // The export is off-screen: lazy images would otherwise never begin loading.
      image.loading = 'eager';
      await Promise.race([image.decode().catch(() => {}), new Promise(resolve => setTimeout(resolve, 8000))]);
    }));
    // Wait for responsive SVG charts to settle at the fixed export width, without changing the calculations.
    await new Promise(resolve => setTimeout(resolve, 250));
    const report = host.querySelector<HTMLElement>('.solar-report-print');
    if (!report) throw new Error('Rapport indisponible.');
    report.querySelectorAll('[data-pdf-exclude], button').forEach(node => node.remove());
    const pdf = await PDFDocument.create();
    pdf.setTitle(`Simulation solaire ${row.reference}`); pdf.setAuthor('Prime Énergies');
    const { StandardFonts } = await import('pdf-lib');
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    let page = pdf.addPage([595.28, 841.89]); let y = 800;
    const blocks: HTMLElement[] = [];
    Array.from(report.children).forEach(child => {
      // Unwrap the white report body to keep each section/chart intact on paper.
      if (child === report.lastElementChild) {
        Array.from(child.children).forEach(inner => {
          if (inner.getAttribute('aria-hidden') === 'false') blocks.push(...Array.from(inner.children) as HTMLElement[]);
          else blocks.push(inner as HTMLElement);
        });
      } else blocks.push(child as HTMLElement);
    });
    for (const block of blocks) {
      if (!block.isConnected || block.hasAttribute('data-pdf-exclude') || block.getBoundingClientRect().height === 0) continue;
      const canvas = await html2canvas(block, { scale: 1.6, useCORS: true, logging: false, backgroundColor: null });
      if (!canvas.width || !canvas.height) continue;
      const image = await pdf.embedPng(canvas.toDataURL('image/png'));
      const scale = Math.min(499 / image.width, 720 / image.height);
      const width = image.width * scale; const height = image.height * scale;
      if (y - height < 60) { page = pdf.addPage([595.28, 841.89]); y = 800; }
      page.drawImage(image, { x: 48, y: y - height, width, height });
      y -= height + 10;
    }
    const pages = pdf.getPages();
    pages.forEach((item, index) => item.drawText(`${row.reference} | ${index + 1}/${pages.length}`, { x: 48, y: 30, size: 8, font }));
    return await pdf.save();
  } finally { root.unmount(); host.remove(); }
}

export async function prepareSolarExport(rows: SolarSimulationRow[], format: SolarExportFormat, renderPdf = buildSolarPdf): Promise<PreparedSolarExport> {
  if (!rows.length) throw new Error('Aucune simulation sélectionnée.');
  const stem = rows.length === 1 ? safeFilename(rows[0].reference) : `simulations-solaires-${rows.length}`;
  if (format === 'csv') return { filename: `${stem}.csv`, blob: new Blob([buildSolarCsv(rows)], { type: 'text/csv;charset=utf-8' }) };
  if (format === 'pdf' && rows.length === 1) {
    const bytes = await renderPdf(rows[0]);
    return { filename: `${stem}.pdf`, blob: new Blob([bytes as BlobPart], { type: 'application/pdf' }) };
  }
  const { default: JSZip } = await import('jszip'); const zip = new JSZip();
  if (format === 'both') zip.file(`${stem}.csv`, buildSolarCsv(rows));
  for (const row of rows) zip.file(`${safeFilename(row.reference)}.pdf`, await renderPdf(row));
  return { filename: `${stem}.zip`, blob: await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }) };
}

/** Called synchronously by the final download button to retain mobile user activation. */
export async function deliverSolarExport({ blob, filename }: PreparedSolarExport) {
  const file = new File([blob], filename, { type: blob.type });
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return; }
    catch (error) { if ((error as DOMException).name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob); const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
