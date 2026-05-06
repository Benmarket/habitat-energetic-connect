// Generates a clean, self-contained HTML file of the guide and triggers a direct download.
// Avoids the browser's print dialog. The file opens nicely in any browser and can be printed to PDF by the user.

export interface GuideDownloadInput {
  title: string;
  excerpt?: string | null;
  contentHtml: string;
  featuredImage?: string | null;
  slug: string;
  category?: string | null;
}

export function downloadGuideAsHtml(g: GuideDownloadInput) {
  const safeTitle = g.title.replace(/</g, "&lt;");
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${safeTitle} — Prime Énergies</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
         color: #0f172a; background: #fff; margin: 0; padding: 0; line-height: 1.7; }
  .wrap { max-width: 820px; margin: 0 auto; padding: 48px 32px 80px; }
  header { border-bottom: 1px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 32px; }
  .brand { font-size: 13px; letter-spacing: .12em; color: #10b981; text-transform: uppercase; font-weight: 700; }
  h1 { font-size: 34px; line-height: 1.2; margin: 12px 0 8px; }
  .excerpt { color: #475569; font-size: 17px; }
  .cat { display:inline-block; background:#f1f5f9; color:#0f172a; padding:4px 10px; border-radius:999px; font-size:12px; margin-top:12px; }
  img { max-width: 100%; height: auto; border-radius: 12px; margin: 18px 0; display: block; }
  h2 { font-size: 24px; margin: 40px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #10b981; display: inline-block; }
  h3 { font-size: 19px; margin: 28px 0 10px; }
  p, li { font-size: 16px; }
  table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px; }
  th, td { border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; }
  th { background: #f8fafc; font-weight: 600; }
  blockquote { border-left: 4px solid #10b981; background: #ecfdf5; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 18px 0; }
  a { color: #059669; }
  footer { margin-top: 64px; padding-top: 24px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px; text-align: center; }
  @media print { .wrap { padding: 16mm; max-width: none; } }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="brand">Prime Énergies — Guide</div>
      <h1>${safeTitle}</h1>
      ${g.excerpt ? `<p class="excerpt">${g.excerpt}</p>` : ""}
      ${g.category ? `<span class="cat">${g.category}</span>` : ""}
    </header>
    ${g.featuredImage ? `<img src="${g.featuredImage}" alt="" />` : ""}
    <article>${g.contentHtml}</article>
    <footer>
      © ${new Date().getFullYear()} Prime Énergies — Merci d'utiliser nos guides.<br/>
      Astuce : utilisez « Imprimer → Enregistrer en PDF » pour conserver une version PDF.
    </footer>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${g.slug || "guide"}-prime-energies.html`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}
