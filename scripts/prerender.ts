/**
 * Pré-rendu statique (postbuild).
 *
 * Le site est une SPA React : sans ce script, les crawlers reçoivent un <body> vide.
 * On génère ici, pour chaque route indexable, un fichier dist/<route>/index.html
 * contenant :
 *   - un <head> complet et spécifique à la page (title, description, canonical, og:*, JSON-LD)
 *   - un contenu HTML réel à l'intérieur de #root (h1, chapeau, corps de l'article)
 *
 * React remplace le contenu de #root au montage : l'utilisateur voit l'app normale,
 * le crawler (et les aperçus sociaux / bots IA qui n'exécutent pas JS) voit du contenu.
 */

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { config } from "dotenv";

config();

const BASE_URL = "https://prime-energies.fr";
const DIST = resolve("dist");
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Garde-fou publication (limite plateforme : 50 000 fichiers)
const MAX_PRERENDER_PAGES = Number(process.env.MAX_PRERENDER_PAGES ?? 2000);

const SITE_NAME = "Prime Énergies";
const DEFAULT_OG = `${BASE_URL}/og-default.jpg`;

interface Page {
  path: string;
  title: string;
  description: string;
  image?: string;
  h1: string;
  body: string; // HTML déjà nettoyé
  jsonLd?: Record<string, unknown>[];
}

/* ------------------------------------------------------------------ utils */

const esc = (s = "") =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Nettoyage du HTML éditeur : on ne garde que du contenu inerte et lisible. */
function cleanHtml(html = ""): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/ on[a-z]+="[^"]*"/gi, "")
    .replace(/ on[a-z]+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

const stripTags = (html = "") =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const clamp = (s: string, n: number) =>
  s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`;

async function rest(path: string): Promise<any[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) {
    console.warn(`prerender: requête "${path}" échouée (${res.status})`);
    return [];
  }
  return res.json();
}

/* --------------------------------------------------------- pages statiques */

const staticPages: Page[] = [
  {
    path: "/services/installation-solaire",
    title: "Installation de panneaux solaires photovoltaïques — devis et aides",
    description:
      "Installation de panneaux solaires photovoltaïques : coût réel, production estimée, prime à l'autoconsommation et revente de surplus. Étude gratuite.",
    h1: "Installation de panneaux solaires photovoltaïques",
    body: `<p>L'installation de panneaux solaires photovoltaïques permet de produire votre propre électricité et de réduire durablement votre facture. Le dimensionnement dépend de votre consommation annuelle, de l'orientation et de l'inclinaison de la toiture, ainsi que de la zone d'ensoleillement.</p>
<h2>Combien coûte une installation solaire ?</h2>
<p>Le budget d'une installation résidentielle varie principalement selon la puissance installée (3 kWc, 6 kWc ou 9 kWc), le type de toiture et l'ajout éventuel d'une batterie de stockage. La prime à l'autoconsommation et le tarif d'achat du surplus réduisent le coût net.</p>
<h2>Quelles aides pour le photovoltaïque ?</h2>
<p>Le photovoltaïque en autoconsommation ouvre droit à la prime à l'autoconsommation et à un contrat d'obligation d'achat du surplus. MaPrimeRénov' ne s'applique pas au photovoltaïque seul.</p>`,
  },
  {
    path: "/services/pompes-a-chaleur",
    title: "Pompe à chaleur : air/eau, air/air, coût et aides 2026",
    description:
      "Pompe à chaleur air/eau ou air/air : fonctionnement, économies attendues, coût d'installation et aides MaPrimeRénov' et CEE. Étude gratuite.",
    h1: "Pompe à chaleur : le guide de l'installation",
    body: `<p>La pompe à chaleur récupère les calories présentes dans l'air ou le sol pour chauffer votre logement avec une consommation électrique réduite. C'est aujourd'hui l'un des remplacements de chaudière les plus aidés.</p>
<h2>Air/eau ou air/air ?</h2>
<p>La pompe à chaleur air/eau alimente un circuit de radiateurs ou un plancher chauffant et peut produire l'eau chaude sanitaire. La pompe à chaleur air/air diffuse l'air via des unités intérieures et n'est pas éligible à MaPrimeRénov'.</p>
<h2>Aides disponibles</h2>
<p>Une pompe à chaleur air/eau peut bénéficier de MaPrimeRénov' et des Certificats d'Économies d'Énergie (CEE), sous conditions de ressources et de performance de l'équipement.</p>`,
  },
  {
    path: "/services/stockage-energie",
    title: "Batterie de stockage solaire : autoconsommation et rentabilité",
    description:
      "Stockage d'énergie solaire : dimensionnement de la batterie, taux d'autoconsommation, durée de vie et rentabilité réelle. Étude personnalisée gratuite.",
    h1: "Stockage de l'énergie solaire",
    body: `<p>Une batterie de stockage permet de consommer le soir l'électricité produite dans la journée. Elle augmente le taux d'autoconsommation d'une installation photovoltaïque, généralement de 30 % à plus de 70 %.</p>
<h2>Quelle capacité choisir ?</h2>
<p>La capacité utile se dimensionne à partir de votre consommation en soirée et de la puissance photovoltaïque installée. Un surdimensionnement dégrade la rentabilité.</p>`,
  },
  {
    path: "/services/audit-energetique",
    title: "Audit énergétique : déroulé, prix et aides",
    description:
      "Audit énergétique réglementaire : ce qu'il contient, comment il se déroule, son prix et les aides mobilisables avant une rénovation d'ampleur.",
    h1: "Audit énergétique du logement",
    body: `<p>L'audit énergétique dresse l'état des lieux thermique du logement et propose des scénarios de travaux chiffrés avec le gain de classe énergétique attendu. Il est obligatoire pour certaines ventes et pour les rénovations d'ampleur aidées.</p>
<h2>Que contient un audit ?</h2>
<p>État de l'isolation, du système de chauffage, de la ventilation, consommation conventionnelle, scénarios de travaux et aides mobilisables.</p>`,
  },
  {
    path: "/services/amelioration-habitat",
    title: "Amélioration de l'habitat : isolation, chauffage, ventilation",
    description:
      "Rénovation énergétique de l'habitat : isolation des combles et des murs, remplacement du chauffage, ventilation. Aides MaPrimeRénov' et CEE.",
    h1: "Amélioration de l'habitat et rénovation énergétique",
    body: `<p>Améliorer la performance d'un logement consiste d'abord à traiter l'enveloppe (combles, murs, menuiseries) avant de remplacer le système de chauffage. Cet ordre garantit le meilleur retour sur investissement.</p>
<h2>Par quoi commencer ?</h2>
<p>L'isolation des combles reste le poste le plus rentable. Vient ensuite l'isolation des murs, puis le remplacement du système de chauffage par un équipement performant.</p>`,
  },
  {
    path: "/simulateurs/solaire",
    title: "Simulateur solaire gratuit : économies et aides en 2 minutes",
    description:
      "Estimez gratuitement la production de votre future installation solaire, vos économies sur 25 ans et les aides mobilisables selon votre région.",
    h1: "Simulateur solaire gratuit",
    body: `<p>Notre simulateur estime en quelques questions la puissance adaptée à votre logement, la production annuelle attendue, les économies sur 25 ans et les aides mobilisables selon votre code postal.</p>`,
  },
  {
    path: "/aides",
    title: "Aides à la rénovation énergétique : MaPrimeRénov', CEE, TVA 5,5 %",
    description:
      "Toutes les aides à la rénovation énergétique : MaPrimeRénov', Certificats d'Économies d'Énergie, TVA réduite, éco-PTZ et aides locales.",
    h1: "Les aides à la rénovation énergétique",
    body: `<p>Plusieurs dispositifs peuvent être cumulés pour financer vos travaux : MaPrimeRénov', les Certificats d'Économies d'Énergie (CEE), la TVA à 5,5 %, l'éco-prêt à taux zéro et les aides des collectivités locales.</p>`,
  },
  {
    path: "/actualites",
    title: "Actualités de la rénovation énergétique et du solaire",
    description:
      "Actualités des aides, du photovoltaïque, des pompes à chaleur et de la réglementation énergétique, mises à jour régulièrement.",
    h1: "Actualités de la rénovation énergétique",
    body: `<p>Retrouvez l'évolution des aides, des tarifs d'achat, de la réglementation thermique et des technologies solaires.</p>`,
  },
  {
    path: "/guides",
    title: "Guides pratiques : solaire, pompe à chaleur, isolation",
    description:
      "Guides pratiques et détaillés pour réussir vos travaux de rénovation énergétique : solaire, pompe à chaleur, isolation, financement.",
    h1: "Guides de la rénovation énergétique",
    body: `<p>Des guides pas à pas pour comprendre les technologies, les coûts et les démarches administratives de votre projet.</p>`,
  },
  {
    path: "/faq",
    title: "Questions fréquentes sur la rénovation énergétique",
    description:
      "Réponses aux questions les plus fréquentes sur les panneaux solaires, les pompes à chaleur, l'isolation et les aides de l'État.",
    h1: "Questions fréquentes",
    body: `<p>Les réponses aux questions les plus courantes sur les travaux de rénovation énergétique et leur financement.</p>`,
  },
  {
    path: "/devenir-partenaire",
    title: "Devenir partenaire installateur — Prime Énergies",
    description:
      "Rejoignez le réseau Prime Énergies : recevez des demandes qualifiées de particuliers en projet de rénovation énergétique.",
    h1: "Devenir partenaire installateur",
    body: `<p>Prime Énergies met en relation des particuliers en projet de rénovation énergétique avec des installateurs qualifiés RGE.</p>`,
  },
];

/* -------------------------------------------------------- pages dynamiques */

async function dynamicPages(): Promise<Page[]> {
  const pages: Page[] = [];

  const posts = await rest(
    "posts?select=title,slug,excerpt,content,featured_image,content_type,published_at,updated_at,meta_title,meta_description,post_categories(categories(slug))&status=eq.published&order=published_at.desc",
  );

  for (const p of posts) {
    const categorySlug = p.post_categories?.[0]?.categories?.slug || "non-classe";
    let path: string | null = null;
    if (p.content_type === "actualite") path = `/actualites/${categorySlug}/${p.slug}`;
    else if (p.content_type === "guide") path = `/guide/${p.slug}`;
    else if (p.content_type === "aide") path = `/aide/${p.slug}`;
    if (!path) continue;

    const plain = stripTags(p.content || "");
    const description =
      p.meta_description || p.excerpt || clamp(plain, 155) || "Prime Énergies";

    pages.push({
      path,
      title: clamp(p.meta_title || p.title, 65),
      description: clamp(description, 158),
      image: p.featured_image || undefined,
      h1: p.title,
      body: `${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ""}${cleanHtml(p.content || "")}`,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": p.content_type === "guide" ? "TechArticle" : "Article",
          headline: p.title,
          description,
          image: p.featured_image || DEFAULT_OG,
          datePublished: p.published_at,
          dateModified: p.updated_at || p.published_at,
          mainEntityOfPage: `${BASE_URL}${path}`,
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            url: BASE_URL,
          },
        },
      ],
    });
  }

  return pages;
}

/* ------------------------------------------------------------ génération */

function buildHtml(template: string, page: Page): string {
  const url = `${BASE_URL}${page.path}`;
  const image = page.image || DEFAULT_OG;

  const head = [
    `<title>${esc(page.title)} | ${SITE_NAME}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    ...(page.jsonLd ?? []).map(
      (o) =>
        `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`,
    ),
  ].join("\n    ");

  // On retire les balises génériques du template pour éviter les doublons.
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta name="description"[^>]*>/i, "")
    .replace(/<link rel="canonical"[^>]*>/i, "")
    .replace(/<meta property="og:(title|description|url|type|image)"[^>]*>/gi, "")
    .replace(/<meta name="twitter:(title|description|image|card)"[^>]*>/gi, "");

  html = html.replace("</head>", `  ${head}\n  </head>`);

  // Contenu à l'intérieur de #root : React le remplace au montage.
  const noscriptBody = `<div id="prerender-content"><main><h1>${esc(page.h1)}</h1>${page.body}</main></div>`;
  html = html.replace('<div id="root"></div>', `<div id="root">${noscriptBody}</div>`);

  return html;
}

async function main() {
  const templatePath = resolve(DIST, "index.html");
  if (!existsSync(templatePath)) {
    console.warn("prerender: dist/index.html introuvable, étape ignorée");
    return;
  }
  const template = readFileSync(templatePath, "utf8");

  let pages = [...staticPages];
  try {
    pages = pages.concat(await dynamicPages());
  } catch (err) {
    console.warn("prerender: contenu dynamique indisponible", err);
  }

  const seen = new Set<string>();
  pages = pages.filter((p) => (seen.has(p.path) ? false : (seen.add(p.path), true)));

  if (pages.length > MAX_PRERENDER_PAGES) {
    console.warn(
      `prerender: ${pages.length} pages > limite ${MAX_PRERENDER_PAGES}, troncature`,
    );
    pages = pages.slice(0, MAX_PRERENDER_PAGES);
  }

  for (const page of pages) {
    const out = resolve(DIST, `.${page.path}/index.html`);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, buildHtml(template, page));
  }

  console.log(`prerender: ${pages.length} pages générées dans dist/`);
}

main();
