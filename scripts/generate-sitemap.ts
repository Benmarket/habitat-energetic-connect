// Runs before `vite dev` and `vite build` (predev/prebuild); writes public/sitemap.xml.
// Le sitemap statique précédent n'exposait que 21 URLs (aucun article, guide, aide
// ni landing régionale). Ce script interroge la base pour publier TOUTES les URLs indexables.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

config();

const BASE_URL = "https://prime-energies.fr";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/actualites", changefreq: "daily", priority: "0.9" },
  { path: "/guides", changefreq: "weekly", priority: "0.9" },
  { path: "/aides", changefreq: "weekly", priority: "0.9" },
  { path: "/faq", changefreq: "monthly", priority: "0.7" },
  { path: "/simulateurs/solaire", changefreq: "monthly", priority: "0.8" },
  { path: "/services/installation-solaire", changefreq: "monthly", priority: "0.8" },
  { path: "/services/pompes-a-chaleur", changefreq: "monthly", priority: "0.8" },
  { path: "/services/stockage-energie", changefreq: "monthly", priority: "0.8" },
  { path: "/services/audit-energetique", changefreq: "monthly", priority: "0.8" },
  { path: "/services/amelioration-habitat", changefreq: "monthly", priority: "0.8" },
  { path: "/devenir-partenaire", changefreq: "monthly", priority: "0.6" },
  { path: "/forum", changefreq: "daily", priority: "0.7" },
  { path: "/plan-du-site", changefreq: "monthly", priority: "0.5" },
  { path: "/mentions-legales", changefreq: "monthly", priority: "0.3" },
  { path: "/politique-confidentialite", changefreq: "monthly", priority: "0.3" },
  { path: "/conditions-utilisation", changefreq: "monthly", priority: "0.3" },
];

async function rest(path: string): Promise<any[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) {
    console.warn(`sitemap: requête "${path}" échouée (${res.status})`);
    return [];
  }
  return res.json();
}

async function dynamicEntries(): Promise<SitemapEntry[]> {
  const entries: SitemapEntry[] = [];

  const posts = await rest(
    "posts?select=slug,content_type,updated_at,published_at,post_categories(categories(slug))&status=eq.published",
  );
  for (const post of posts) {
    const lastmod = post.updated_at || post.published_at || undefined;
    if (post.content_type === "actualite") {
      const categorySlug = post.post_categories?.[0]?.categories?.slug || "non-classe";
      entries.push({
        path: `/actualites/${categorySlug}/${post.slug}`,
        lastmod,
        changefreq: "weekly",
        priority: "0.8",
      });
    } else if (post.content_type === "guide") {
      entries.push({ path: `/guide/${post.slug}`, lastmod, changefreq: "monthly", priority: "0.8" });
    } else if (post.content_type === "aide") {
      entries.push({ path: `/aide/${post.slug}`, lastmod, changefreq: "monthly", priority: "0.7" });
    }
  }

  const landings = await rest("landing_pages?select=path,updated_at&seo_status=eq.seo");
  for (const lp of landings) {
    if (lp.path) {
      entries.push({
        path: lp.path,
        lastmod: lp.updated_at || undefined,
        changefreq: "weekly",
        priority: "0.9",
      });
    }
  }

  const forums = await rest("forum_categories?select=slug,updated_at");
  for (const fc of forums) {
    entries.push({
      path: `/forum/categorie/${fc.slug}`,
      lastmod: fc.updated_at || undefined,
      changefreq: "daily",
      priority: "0.6",
    });
  }

  return entries;
}

function render(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    ``,
  ].join("\n");
}

async function main() {
  let entries = [...staticEntries];
  try {
    entries = entries.concat(await dynamicEntries());
  } catch (err) {
    console.warn("sitemap: contenu dynamique indisponible, fallback statique", err);
  }

  // Dédoublonnage par chemin (ex: /landing/solaire présent 2x)
  const seen = new Set<string>();
  entries = entries.filter((e) => (seen.has(e.path) ? false : (seen.add(e.path), true)));

  writeFileSync(resolve("public/sitemap.xml"), render(entries));
  console.log(`sitemap.xml written (${entries.length} entries)`);
}

main();
