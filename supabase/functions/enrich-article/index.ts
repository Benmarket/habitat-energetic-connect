// Enrich + AUDIT COMPLET d'un article : maillage, textes, chiffres, images, alt,
// CTA vides/cassés, tableaux, faits périmés, conformité éditoriale.
// Admin-only. Un post à la fois.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY")!;

function postUrl(p: any) {
  if (p.content_type === "guide") return `/guide/${p.slug}`;
  if (p.content_type === "aide") return `/aide/${p.slug}`;
  const catSlug = p.categories?.[0]?.category?.slug || "energie";
  return `/actualites/${catSlug}/${p.slug}`;
}

// ---- Heuristic pre-audit (deterministic, no AI cost) ----
type ContentType = "aide" | "actualite" | "guide";

// Règles par type — chaque format a sa propre logique éditoriale.
const TYPE_RULES: Record<ContentType, {
  label: string;
  minLength: number;
  targetLength: number;
  expectsImage: boolean;
  minH2: number;
  expectsFaq: boolean;
  maxInternalLinks: number;
  minInternalLinks: number;
  ctaTarget: string;
  editorialNotes: string;
}> = {
  aide: {
    label: "Aide / Subvention",
    minLength: 1500,
    targetLength: 3500,
    expectsImage: false, // VOULU : pas d'image à la une sur les aides
    minH2: 2,
    expectsFaq: false,
    maxInternalLinks: 3,
    minInternalLinks: 1,
    ctaTarget: "/aides",
    editorialNotes:
      "Format court, factuel, conditionnel obligatoire pour les montants ('peut atteindre', 'jusqu'à'). Pas d'image à la une (voulu). Ne PAS forcer de FAQ ni de bloc 'Pour aller plus loin' volumineux. Maillage léger (1-3 liens max), surtout vers /aides et simulateurs pertinents.",
  },
  actualite: {
    label: "Actualité",
    minLength: 4000,
    targetLength: 7000,
    expectsImage: true,
    minH2: 3,
    expectsFaq: false,
    maxInternalLinks: 5,
    minInternalLinks: 2,
    ctaTarget: "/aides",
    editorialNotes:
      "Article d'actualité : ton journalistique, dates récentes, sources implicites. Image à la une obligatoire. Maillage 2-5 liens vers articles connexes récents. FAQ optionnelle.",
  },
  guide: {
    label: "Guide",
    minLength: 7000,
    targetLength: 10000,
    expectsImage: true,
    minH2: 5,
    expectsFaq: true,
    maxInternalLinks: 8,
    minInternalLinks: 4,
    ctaTarget: "/simulateurs/solaire",
    editorialNotes:
      "Guide approfondi : structure pédagogique, tableaux, étapes, FAQ obligatoire en bas. Image à la une obligatoire. Maillage riche (4-8 liens) vers aides et autres guides. Bloc 'Pour aller plus loin' recommandé.",
  },
};

function getRules(t: string | null | undefined) {
  if (t === "aide" || t === "guide") return TYPE_RULES[t];
  return TYPE_RULES.actualite;
}

function preAudit(html: string, meta: { title: string; image: string | null; metaTitle: string | null; metaDescription: string | null; faqCount: number; contentType: string; }) {
  const rules = getRules(meta.contentType);

  // === DEUX AXES SÉPARÉS ===
  // - informative = conformité du CONTENU (véracité, non-mélange dispositifs, RGPD éditorial, chiffres, dates)
  // - seo         = conformité TECHNIQUE (structure, meta, liens, images alt, tableaux, longueur, H2)
  const informative: { issues: string[]; warnings: string[] } = { issues: [], warnings: [] };
  const seo: { issues: string[]; warnings: string[] } = { issues: [], warnings: [] };
  const stats: Record<string, number> = {};

  const len = html.length;
  stats.length = len;
  const text = html.replace(/<[^>]+>/g, " ");

  // ─────────────────────────────────────────────
  // AXE 1 — CONFORMITÉ INFORMATIVE (fond)
  // ─────────────────────────────────────────────

  // 1.a Mélange dispositifs interdits (critique — PV/batterie/onduleur ≠ MaPrimeRénov')
  const hasMPR = /MaPrimeR[ée]nov'?/i.test(text);
  const hasPV = /(photovolta[ïi]que|panneau(x)? solaire(s)?)/i.test(text);
  const hasBatterie = /batterie(s)?\s+(de\s+stockage|solaire|lithium)/i.test(text);
  const hasOnduleur = /onduleur(s)?\s+(hybride|solaire)/i.test(text);
  if (hasMPR && hasPV) informative.issues.push("MaPrimeRénov' associé au photovoltaïque (PV strictement exclu de MPR)");
  if (hasMPR && hasBatterie) informative.issues.push("MaPrimeRénov' associé à une batterie (batteries non éligibles à MPR)");
  if (hasMPR && hasOnduleur) informative.issues.push("MaPrimeRénov' associé à un onduleur (onduleurs non éligibles à MPR)");

  // 1.b Mélange dispositifs dans la même phrase (MPR + prime autoconso / EDF OA)
  const sentences = text.split(/[.!?]\s+/);
  const mixedSentence = sentences.find((s) =>
    /MaPrimeR[ée]nov'?/i.test(s) && /(prime\s+(à\s+l'?)?autoconsommation|EDF\s*OA|tarif\s+d'?achat)/i.test(s)
  );
  if (mixedSentence) informative.warnings.push("Une phrase mélange MaPrimeRénov' et prime autoconsommation/EDF OA — dispositifs distincts, à séparer");

  // 1.c Faits obsolètes / erreurs récurrentes
  if (/\bCITE\b/.test(text) && /cr[ée]dit d['']imp[oô]t/i.test(text)) informative.issues.push("Mention du CITE (supprimé depuis 2021)");
  if (/RE2025/.test(text)) informative.issues.push("Mention 'RE2025' — la norme est RE2020");

  // 1.d Années potentiellement périmées
  const yearHits = [...text.matchAll(/\b(en|depuis|pour|dès|fin|début|courant|d[ée]but)\s+(202[3-5])\b/gi)];
  if (yearHits.length) {
    const years = [...new Set(yearHits.map((m) => m[2]))].sort();
    informative.warnings.push(`Année(s) potentiellement périmée(s) : ${years.join(", ")} — à réactualiser ou neutraliser`);
  }

  // 1.e Verbes promissoires (RGPD/DGCCRF : formulation trompeuse)
  const promissoryPatterns = [
    /\bvous\s+(?:allez\s+)?économiser(?:ez)?\b/i,
    /\bvous\s+(?:allez\s+)?toucher(?:ez)?\b/i,
    /\bvous\s+(?:allez\s+)?recev(?:oir|rez)\b/i,
    /\bvous\s+(?:allez\s+)?gagner(?:ez)?\b/i,
    /\bgarant(?:i|ie)\s+de\s+\d/i,
  ];
  const promissoryHits = promissoryPatterns.filter((r) => r.test(text));
  if (promissoryHits.length) {
    informative.warnings.push(`Formulation promissoire détectée (${promissoryHits.length} occurrence(s)) — utiliser le conditionnel ("pourriez", "jusqu'à", "selon éligibilité")`);
  }

  // 1.f Montants sans conditionnel — obligatoire pour aide, recommandé partout ailleurs
  const hasAmount = /\d[\d\s]*€|\d[\d\s]*\s*euros/i.test(text);
  const hasConditional = /(peut atteindre|jusqu'?à|selon|en fonction|sous conditions|éligibilité|pourrait|pourriez)/i.test(text);
  if (hasAmount && !hasConditional) {
    if (meta.contentType === "aide") {
      informative.issues.push("Montants mentionnés sans conditionnel ('jusqu'à', 'selon'…) — obligatoire pour une aide");
    } else {
      informative.warnings.push("Montants mentionnés sans conditionnel — recommandé pour éviter toute promesse chiffrée");
    }
  }

  // 1.g Aides mentionnées sans année → risque d'obsolescence silencieuse
  const aideMentioned = /(MaPrimeR[ée]nov'?|prime\s+(à\s+l'?)?autoconsommation|CEE|Coup\s+de\s+pouce|éco.?PTZ|Denormandie|prime\s+énergie)/i.test(text);
  const hasYearAnywhere = /\b20(2[0-9]|3[0-9])\b/.test(text);
  if (aideMentioned && !hasYearAnywhere) {
    informative.warnings.push("Aide(s) mentionnée(s) sans année de référence — dater les montants (trimestre + année)");
  }

  // 1.h Chiffres régionaux ultra-précis suspects (ensoleillement)
  const suspectHours = [...text.matchAll(/\b(\d{4})\s*h(?:eures)?\s+d['e]?\s?ensoleillement/gi)];
  if (suspectHours.length > 0) {
    informative.warnings.push("Chiffre d'ensoleillement précis détecté — préférer une fourchette (ex : 2 400-2 700 h/an) ou citer la source");
  }

  // ─────────────────────────────────────────────
  // AXE 2 — CONFORMITÉ SEO / TECHNIQUE (forme)
  // ─────────────────────────────────────────────

  const imgs = html.match(/<img[^>]+>/gi) || [];
  stats.images_inline = imgs.length;
  const noAlt = imgs.filter((i) => !/\balt\s*=\s*"[^"]+"/i.test(i));
  if (noAlt.length) seo.warnings.push(`${noAlt.length}/${imgs.length} image(s) sans attribut alt`);
  const placeholders = imgs.filter((i) => /placeholder|lorempixel|example\.com/i.test(i));
  if (placeholders.length) seo.issues.push(`${placeholders.length} image(s) placeholder à remplacer`);

  if (rules.expectsImage && !meta.image) {
    seo.issues.push("Aucune image à la une (featured_image vide)");
  }
  const extImgs = imgs.filter((i) => /src="https?:\/\//i.test(i) && !/supabase|lovable|prime-energies/i.test(i));
  if (extImgs.length) seo.warnings.push(`${extImgs.length} image(s) externe(s) — risque de lien mort`);

  const links = [...html.matchAll(/<a\b[^>]*href\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)];
  stats.links_total = links.length;
  const empty = links.filter((m) => m[1] === "" || m[1] === "#");
  if (empty.length) seo.issues.push(`${empty.length} lien(s) avec href vide ou '#'`);
  const noText = links.filter((m) => !m[2].replace(/<[^>]+>/g, "").trim());
  if (noText.length) seo.warnings.push(`${noText.length} lien(s) sans texte d'ancre`);
  const internal = links.filter((m) => m[1].startsWith("/") || /prime-energies\.fr/.test(m[1]));
  stats.links_internal = internal.length;
  stats.links_external = links.length - internal.length - empty.length;
  if (internal.length < rules.minInternalLinks && len > rules.minLength) {
    seo.warnings.push(`Maillage interne faible pour un ${rules.label.toLowerCase()} (${internal.length} liens, min ${rules.minInternalLinks})`);
  }

  const tables = html.match(/<table\b[\s\S]*?<\/table>/gi) || [];
  stats.tables = tables.length;
  if (tables.some((t) => !/<th\b/i.test(t))) seo.warnings.push("Tableau sans en-tête <th>");

  if (!meta.metaTitle) seo.issues.push("meta_title vide");
  else if (meta.metaTitle.length > 65) seo.warnings.push(`meta_title trop long (${meta.metaTitle.length})`);
  if (!meta.metaDescription) seo.issues.push("meta_description vide");
  else if (meta.metaDescription.length > 165) seo.warnings.push(`meta_description trop longue (${meta.metaDescription.length})`);
  else if (meta.metaDescription.length < 100) seo.warnings.push(`meta_description courte (${meta.metaDescription.length})`);
  if (meta.title.length > 75) seo.warnings.push(`Titre long (${meta.title.length})`);
  if (/\btest+\b/i.test(meta.title)) seo.issues.push("Titre contient 'test'");

  if (rules.expectsFaq && meta.faqCount === 0 && len > rules.minLength) {
    seo.warnings.push(`Aucune FAQ — recommandée pour un ${rules.label.toLowerCase()}`);
  }

  if (len < rules.minLength) {
    seo.issues.push(`Contenu trop court pour un ${rules.label.toLowerCase()} (${len} car, min ${rules.minLength})`);
  } else if (len < rules.targetLength) {
    seo.warnings.push(`Contenu court (${len} car, cible ${rules.targetLength})`);
  }

  const h2 = (html.match(/<h2\b/gi) || []).length;
  stats.h2_count = h2;
  if (h2 < rules.minH2 && len > rules.minLength) {
    seo.warnings.push(`Seulement ${h2} <h2> (min ${rules.minH2} pour un ${rules.label.toLowerCase()})`);
  }

  // Rétrocompatibilité : issues/warnings agrégés (utilisés par AdminArticlesAudit)
  const issues = [...informative.issues, ...seo.issues];
  const warnings = [...informative.warnings, ...seo.warnings];

  return { issues, warnings, stats, rules, informative, seo };
}

type Focus = "all" | "informative" | "seo";

function issuesFor(heuristic: any, focus: Focus): string {
  const informative = heuristic.informative || { issues: [], warnings: [] };
  const seo = heuristic.seo || { issues: [], warnings: [] };
  let iss: string[] = [], wrn: string[] = [];
  if (focus === "informative") { iss = informative.issues; wrn = informative.warnings; }
  else if (focus === "seo") { iss = seo.issues; wrn = seo.warnings; }
  else { iss = [...informative.issues, ...seo.issues]; wrn = [...informative.warnings, ...seo.warnings]; }
  return [...iss.map((i: string) => "❌ " + i), ...wrn.map((w: string) => "⚠️ " + w)].join("\n") || "(aucun)";
}

function focusBlock(focus: Focus): string {
  if (focus === "informative") {
    return `🎯 FOCUS EXCLUSIF — CORRECTIONS INFORMATIVES UNIQUEMENT
Tu ne dois corriger QUE le fond (véracité, dispositifs, montants, dates).
INTERDIT dans ce passage : ajouter/supprimer des liens, images, alt, tableaux, H2, meta, FAQ.
Autorisé :
  • Séparer strictement les dispositifs cités (MaPrimeRénov' / prime autoconsommation / CEE / EDF OA / TVA) — chacun sa phrase, jamais mélangés.
  • Retirer toute association MaPrimeRénov' ↔ photovoltaïque, batterie ou onduleur (dispositifs incompatibles).
  • Conditionnaliser tout montant en euros : "5 000 €" → "jusqu'à 5 000 € selon éligibilité".
  • Remplacer verbes promissoires ("vous économiserez", "vous toucherez") par des formulations conditionnelles ("vous pourriez", "peut atteindre").
  • Ajouter une année/trimestre à toute aide mentionnée sans référence temporelle.
  • Corriger CITE, RE2025, années 2023-2024 en actualisant ou neutralisant.
  • Remplacer chiffres régionaux ultra-précis par des fourchettes prudentes.
  • NE JAMAIS inventer un chiffre, un montant, un dispositif régional : préférer la formulation neutre ("selon votre territoire", "à vérifier auprès de…").`;
  }
  if (focus === "seo") {
    return `🎯 FOCUS EXCLUSIF — CORRECTIONS SEO / TECHNIQUE UNIQUEMENT
Tu ne dois corriger QUE la forme (structure, liens, meta, images, tableaux, H2).
INTERDIT dans ce passage : modifier des chiffres, dispositifs, montants, dates, formulations éditoriales.
Autorisé :
  • Corriger les <a href=""> ou <a href="#"> vers un lien interne pertinent (/aides, /simulateurs/solaire, /contact) ou supprimer.
  • Ajouter un attribut alt descriptif sur toute <img> qui en manque.
  • Ajouter <th> aux tableaux sans en-tête.
  • Ajouter des <h2> intermédiaires pour scinder les gros paragraphes.
  • Ajouter les liens internes de maillage manquants (ancres descriptives, articles listés).
  • Rien d'autre — le texte des phrases ne doit pas changer de sens.`;
  }
  return "";
}

function buildPrompt(type: ContentType, post: any, heuristic: any, candidates: string, today: string, pubDate: string, focus: Focus = "all") {
  const rules = TYPE_RULES[type];
  const focusHeader = focusBlock(focus);
  const issuesList = issuesFor(heuristic, focus);

  // ===== AIDE : prompt minimaliste, on ne touche presque pas =====
  if (type === "aide") {
    return `Tu es éditeur senior spécialisé subventions énergie France. ${today}. Aide publiée le ${pubDate}.

⚠️ TU ÉDITES UNE PAGE "AIDE" — format court et factuel. NE TRANSFORME PAS EN ARTICLE OU EN GUIDE.
${rules.editorialNotes}

${focusHeader}

PROBLÈMES DÉTECTÉS :
${issuesList}

INTERVENTIONS AUTORISÉES (respect strict du FOCUS ci-dessus si défini) :
A. Corriger les CTA cassés (<a href="#"> ou vide) → /aides ou /simulateurs/solaire selon contexte, ou suppression.
B. Ajouter alt descriptif aux <img> qui en manquent.
C. Conditionnaliser les montants : "5 000 €" → "jusqu'à 5 000 € selon le profil" / "peut atteindre…".
D. Corriger faits périmés (CITE, RE2025, PV+MPR, dates 2023/2024).
E. Maillage : 1 à ${rules.maxInternalLinks} liens internes MAXIMUM (ancres descriptives). Pas de bloc "Pour aller plus loin" volumineux.
F. NE PAS allonger le contenu artificiellement, NE PAS ajouter de FAQ, NE PAS ajouter d'images.
G. Préserver la structure courte de l'aide.

ARTICLES DISPONIBLES POUR MAILLAGE :
${candidates}

TITRE : ${post.title}
CONTENU HTML :
${post.content}

JSON STRICT :
{"updated_content":"<html>","audit":{"interlinks_added":[],"ctas_fixed":[],"images_alt_added":0,"outdated_facts_corrected":[],"numbers_normalized":[],"tables_fixed":0,"remaining_issues":[],"veracity_flags":[],"quality_score":0}}`;
  }

  // ===== GUIDE =====
  if (type === "guide") {
    return `Tu es éditeur SEO senior + fact-checker énergie/rénovation France. ${today}. Guide publié le ${pubDate}.

⚠️ TU ÉDITES UN "GUIDE" — format long et pédagogique. NE TRANSFORME PAS EN ACTUALITÉ.
${rules.editorialNotes}

${focusHeader}

PROBLÈMES DÉTECTÉS :
${issuesList}

TÂCHES (respect strict du FOCUS ci-dessus si défini) :
A. MAILLAGE INTERNE — Insère ${rules.minInternalLinks} à ${rules.maxInternalLinks} liens contextuels vers les articles listés. Ancres descriptives. 1 lien max/paragraphe.
B. BLOC "Pour aller plus loin" avant la FAQ (2-3 liens) :
<div class="my-8 p-6 rounded-xl bg-muted/50 border border-border"><h3 class="text-lg font-semibold mb-3">Pour aller plus loin</h3><ul class="space-y-2"><li>→ <a href="/URL">Titre</a></li></ul></div>
C. CTA cassés (<a href="#">) → /simulateurs/solaire (solaire), /aides (subventions), /contact sinon. Ou suppression.
D. Alt descriptif sur toutes <img>.
E. Faits périmés : dates 2023/2024, CITE, RE2025, PV+MPR (PV exclu), chiffres aberrants → conditionnel ou bornes prudentes. NE PAS inventer.
F. Tableaux sans <th> → ajoute en-tête approprié.
G. Si < ${rules.minH2} <h2>, scinde un long paragraphe avec un <h2> pertinent.
H. NE MODIFIE PAS : FAQ existante, ton, widgets data-*, featured_image.

ARTICLES DISPONIBLES :
${candidates}

TITRE : ${post.title}
CONTENU HTML :
${post.content}

JSON STRICT :
{"updated_content":"<html>","audit":{"interlinks_added":[],"ctas_fixed":[],"images_alt_added":0,"outdated_facts_corrected":[],"numbers_normalized":[],"tables_fixed":0,"remaining_issues":[],"veracity_flags":[],"quality_score":0}}`;
  }

  // ===== ACTUALITE =====
  return `Tu es éditeur SEO senior + fact-checker énergie/rénovation France. ${today}. Actualité publiée le ${pubDate}.

⚠️ TU ÉDITES UNE "ACTUALITÉ" — ton journalistique, factuel, daté. NE TRANSFORME PAS EN GUIDE NI EN AIDE.
${rules.editorialNotes}

${focusHeader}

PROBLÈMES DÉTECTÉS :
${issuesList}

TÂCHES (respect strict du FOCUS ci-dessus si défini) :
A. MAILLAGE — ${rules.minInternalLinks} à ${rules.maxInternalLinks} liens internes vers les articles listés, ancres descriptives.
B. CTA cassés (<a href="#">) → lien interne pertinent ou suppression. CTA factice → /aides ou /simulateurs/solaire selon sujet.
C. Alt descriptif sur <img>.
D. Faits périmés (dates 2023/2024 à actualiser ou neutraliser, CITE, RE2025, PV+MPR, chiffres aberrants). NE PAS inventer.
E. Tableaux : ajoute <th> si absent.
F. Si < ${rules.minH2} <h2>, ajoute un sous-titre intermédiaire.
G. NE MODIFIE PAS : ton, dates explicites de l'événement, widgets data-*, featured_image.
H. NE PAS allonger artificiellement vers un format guide.

ARTICLES DISPONIBLES :
${candidates}

TITRE : ${post.title}
CONTENU HTML :
${post.content}

JSON STRICT :
{"updated_content":"<html>","audit":{"interlinks_added":[],"ctas_fixed":[],"images_alt_added":0,"outdated_facts_corrected":[],"numbers_normalized":[],"tables_fixed":0,"remaining_issues":[],"veracity_flags":[],"quality_score":0}}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireAuth(req, { corsHeaders, requireAdmin: true });
  if (!auth.ok) return auth.response;

  try {
    const { post_id, dry_run = false, mode = "full" } = await req.json();
    if (!post_id) {
      return new Response(JSON.stringify({ error: "post_id requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: post, error: pErr } = await sb
      .from("posts")
      .select("id,slug,title,content,content_type,published_at,featured_image,meta_title,meta_description,faq")
      .eq("id", post_id)
      .maybeSingle();
    if (pErr || !post) {
      return new Response(JSON.stringify({ error: "Post introuvable" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) HEURISTIC AUDIT (always run, fast, free)
    const heuristic = preAudit(post.content || "", {
      title: post.title || "",
      image: post.featured_image,
      metaTitle: post.meta_title,
      metaDescription: post.meta_description,
      faqCount: Array.isArray(post.faq) ? post.faq.length : 0,
      contentType: post.content_type || "actualite",
    });

    // Audit-only mode : pas d'IA
    if (mode === "audit_only") {
      return new Response(JSON.stringify({
        ok: true, post_id, title: post.title, slug: post.slug, content_type: post.content_type, changed: false,
        audit: {
          heuristic,
          interlinks_added: [], outdated_facts_corrected: [],
          remaining_issues: [...heuristic.issues, ...heuristic.warnings],
          quality_score: Math.max(0, 100 - heuristic.issues.length * 15 - heuristic.warnings.length * 5),
        },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2) Maillage candidates — filtrés par type pour cohérence
    const postType: ContentType = (post.content_type === "aide" || post.content_type === "guide")
      ? post.content_type : "actualite";

    const { data: others } = await sb
      .from("posts")
      .select("slug,title,excerpt,content_type,categories:post_categories(category:categories(slug))")
      .eq("status", "published")
      .neq("id", post_id)
      .order("published_at", { ascending: false })
      .limit(50);

    // Pour une aide : prioriser autres aides + guides connexes (pas trop d'actualités datées)
    // Pour un guide : prioriser aides + autres guides
    // Pour une actualité : tout type accepté
    const filteredOthers = (others || []).filter((p: any) => {
      if (postType === "aide") return p.content_type === "aide" || p.content_type === "guide";
      if (postType === "guide") return true;
      return true;
    });

    const candidates = filteredOthers
      .filter((p: any) => p.slug && p.title)
      .slice(0, postType === "aide" ? 15 : 30)
      .map((p: any) => `- "${p.title}" [${p.content_type}] → ${postUrl(p)}${p.excerpt ? ` | ${String(p.excerpt).slice(0, 120)}` : ""}`)
      .join("\n");

    const today = new Date().toISOString().slice(0, 10);
    const pubDate = post.published_at ? String(post.published_at).slice(0, 10) : "inconnu";

    const prompt = buildPrompt(postType, post, heuristic, candidates, today, pubDate);


    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI error", detail: t.slice(0, 500) }), {
        status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content || "{}";
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { updated_content: post.content, audit: { error: "parse_failed" } };
    }

    const updated = parsed.updated_content || post.content;

    // GARDE-FOU TYPE : on n'écrit JAMAIS dans des champs liés au format (ex: featured_image, content_type).
    // Et on s'assure que la longueur reste cohérente avec le type (ne pas qu'une aide devienne un guide).
    const newLen = (updated || "").length;
    const oldLen = (post.content || "").length;
    const rules = getRules(post.content_type);
    let blocked: string | null = null;
    if (postType === "aide" && newLen > oldLen * 2.5 && newLen > 4000) {
      blocked = `Modification refusée : le contenu d'aide a triplé (${oldLen}→${newLen}). Risque de transformation en guide.`;
    }
    if (postType === "actualite" && newLen > oldLen * 2 && newLen > rules.targetLength * 1.5) {
      blocked = `Modification refusée : actualité gonflée artificiellement (${oldLen}→${newLen}).`;
    }

    const audit = { ...(parsed.audit || {}), heuristic, content_type: post.content_type, blocked };

    if (!dry_run && !blocked && updated && updated !== post.content) {
      await sb.from("posts").update({ content: updated, updated_at: new Date().toISOString() }).eq("id", post_id);
    }

    return new Response(JSON.stringify({
      ok: true, post_id, title: post.title, slug: post.slug, content_type: post.content_type,
      changed: !blocked && updated !== post.content, audit,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
