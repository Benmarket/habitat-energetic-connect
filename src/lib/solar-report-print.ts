/** Print a snapshot of the displayed report, including its rendered SVG charts. */
export async function printSolarReport(report: HTMLElement) {
  const frame = document.createElement('iframe');
  frame.className = 'solar-print-frame';
  frame.title = 'Compte rendu solaire PDF';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) { frame.remove(); throw new Error('Impossible de préparer le PDF'); }
  doc.open();
  doc.write('<!doctype html><html lang="fr"><head><title>Compte rendu solaire — Prime Énergies</title></head><body></body></html>');
  doc.close();
  const loads: Promise<unknown>[] = [];
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
    const clone = node.cloneNode(true) as HTMLElement;
    if (clone.tagName === 'LINK') loads.push(new Promise(resolve => {
      clone.onload = resolve; clone.onerror = resolve;
    }));
    doc.head.appendChild(clone);
  });
  const snapshot = report.cloneNode(true) as HTMLElement;
  const sourceImages = report.querySelectorAll<HTMLImageElement>('img');
  snapshot.querySelectorAll<HTMLImageElement>('img').forEach((image, index) => {
    const source = sourceImages[index];
    if (source) { image.src = source.currentSrc || source.src; image.loading = 'eager'; }
  });
  snapshot.querySelectorAll('button, [data-pdf-exclude], [aria-hidden="true"]').forEach(node => node.remove());
  // Preserve the actual chart sizes instead of recalculating data at paper width.
  const sourceCharts = report.querySelectorAll<HTMLElement>('.recharts-responsive-container');
  snapshot.querySelectorAll<HTMLElement>('.recharts-responsive-container').forEach((node, index) => {
    const source = sourceCharts[index];
    if (source) { node.style.width = `${source.clientWidth}px`; node.style.height = `${source.clientHeight}px`; }
  });
  doc.body.appendChild(snapshot);
  const style = doc.createElement('style');
  style.textContent = `@page { size: A4; margin: 12mm; }
    html, body { margin: 0; padding: 0; font-size: 80%; }
    * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .solar-report-print { width: 100%; max-width: none; box-shadow: none; }
    .solar-report-print section, .solar-report-print tr, .solar-report-print .grid > div, .recharts-responsive-container { break-inside: avoid; }
    .solar-report-print { overflow: visible; }
    .recharts-wrapper, .recharts-surface { max-width: 100%; }
    .recharts-tooltip-wrapper { display: none; }`;
  doc.head.appendChild(style);
  await Promise.all(loads);
  await doc.fonts.ready;
  await Promise.all(Array.from(doc.images).map(image => image.decode().catch(() => {})));
  const win = frame.contentWindow;
  if (!win) { frame.remove(); throw new Error('Impossible de préparer le PDF'); }
  win.addEventListener('afterprint', () => frame.remove(), { once: true });
  win.focus();
  win.print();
}