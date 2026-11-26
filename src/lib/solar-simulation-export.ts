/** Export immutable reports only; never call the calculation engine here. */
export type SolarSimulationRow = {
  reference: string; created_at: string; lead_id: string | null;
  first_name: string | null; last_name: string | null; email: string | null; phone: string | null;
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
  const records = rows.map(row => ({
    reference: row.reference, created_at: row.created_at, lead_id: row.lead_id,
    first_name: row.first_name, last_name: row.last_name, email: row.email, phone: row.phone,
    ...flattenSolarData(row.snapshot, 'snapshot'), snapshot_json: JSON.stringify(row.snapshot),
  }));
  const columns = [...new Set(records.flatMap(record => Object.keys(record)))];
  return '\uFEFF' + [columns.map(solarCsvCell).join(';'), ...records.map(record =>
    columns.map(column => solarCsvCell((record as Record<string, unknown>)[column])).join(';'))].join('\r\n');
}

const safeFilename = (reference: string) => reference.replace(/[^a-zA-Z0-9_-]/g, '_');

export async function buildSolarPdf(row: SolarSimulationRow): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Simulation solaire ${row.reference}`); pdf.setAuthor('Prime Énergies');
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  // Keep French/Latin characters and handle any unsupported user-entered glyph safely.
  const printable = (text: string) => [...text.replace(/[\u202f\u00a0]/g, ' ')].map(character => {
    try { font.encodeText(character); return character; } catch { return '?'; }
  }).join('');
  let page = pdf.addPage([595.28, 841.89]); let y = 790;
  const wrap = (text: string, size: number, width: number) => {
    const lines: string[] = []; let current = '';
    for (const word of printable(text).split(/\s+/)) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) { current = candidate; continue; }
      if (current) { lines.push(current); current = ''; }
      for (const char of word) {
        if (font.widthOfTextAtSize(current + char, size) > width) { lines.push(current); current = ''; }
        current += char;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : ['—'];
  };
  const ensure = (height: number) => {
    if (y - height < 58) { page = pdf.addPage([595.28, 841.89]); y = 790; }
  };
  const text = (value: string, size = 10, strong = false) => {
    const lines = wrap(value, size, 499);
    for (const line of lines) {
      ensure(size + 5); page.drawText(line, { x: 48, y, size, font: strong ? bold : font }); y -= size + 5;
    }
  };
  const heading = (title: string) => { ensure(50); y -= 13; text(title, 13, true); y -= 4; };
  const fields = (data: unknown, labels: Record<string, string>) => {
    for (const [key, value] of Object.entries(flattenSolarData(data))) {
      const label = key.split('.').map(part => labels[part] ?? SOLAR_INPUT_LABELS[part] ?? RESULT_LABELS[part] ?? part).join(' / ');
      text(`${label} : ${solarValueText(value)}`);
    }
  };
  text('PRIME ÉNERGIES', 12, true); y -= 6;
  text('Compte rendu de simulation solaire', 20, true);
  text(row.reference, 10, true);
  text(`Simulation du ${new Date(row.created_at).toLocaleString('fr-FR')}`);
  text(`Client : ${[row.first_name, row.last_name].filter(Boolean).join(' ') || 'Sans contact'}`);
  if (row.email) text(`Email : ${row.email}`);
  if (row.phone) text(`Téléphone : ${row.phone}`);
  heading('Informations renseignées'); fields(row.snapshot.inputs ?? {}, SOLAR_INPUT_LABELS);
  const engine = row.snapshot.engine ?? {};
  heading('Résultat et recommandation enregistrés');
  const { sans, avec, ...context } = engine;
  fields(context, RESULT_LABELS);
  for (const [title, scenario] of [['Sans batterie', sans], ['Avec batterie', avec]] as const) {
    if (!scenario) continue;
    heading(title); fields(scenario, RESULT_LABELS);
  }
  // Other immutable data (optimal orientation and comparison table) remain available in the PDF.
  const { inputs: _inputs, engine: _engine, ...other } = row.snapshot;
  if (Object.keys(other).length) { heading('Données complémentaires conservées'); fields(other, RESULT_LABELS); }
  heading('Avertissement');
  text('Calcul automatique et estimatif : des erreurs sont possibles. Les prix, aides et gains sont indicatifs et dépendent du territoire et du projet. Un professionnel recontactera la personne conformément au consentement donné pour vérifier le projet.');
  text('Prime Énergies met en relation avec des partenaires agréés et ne réalise pas directement les installations. Le remplacement éventuel de la batterie n’est pas inclus.');
  const pages = pdf.getPages();
  pages.forEach((item, index) => item.drawText(`Prime Énergies — ${row.reference} — ${index + 1}/${pages.length}`, { x: 48, y: 30, size: 8, font }));
  return pdf.save();
}

export async function prepareSolarExport(rows: SolarSimulationRow[], format: SolarExportFormat): Promise<PreparedSolarExport> {
  if (!rows.length) throw new Error('Aucune simulation sélectionnée.');
  const stem = rows.length === 1 ? safeFilename(rows[0].reference) : `simulations-solaires-${rows.length}`;
  if (format === 'csv') return { filename: `${stem}.csv`, blob: new Blob([buildSolarCsv(rows)], { type: 'text/csv;charset=utf-8' }) };
  if (format === 'pdf' && rows.length === 1) {
    const bytes = await buildSolarPdf(rows[0]);
    return { filename: `${stem}.pdf`, blob: new Blob([bytes as BlobPart], { type: 'application/pdf' }) };
  }
  const { default: JSZip } = await import('jszip'); const zip = new JSZip();
  if (format === 'both') zip.file(`${stem}.csv`, buildSolarCsv(rows));
  for (const row of rows) zip.file(`${safeFilename(row.reference)}.pdf`, await buildSolarPdf(row));
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
