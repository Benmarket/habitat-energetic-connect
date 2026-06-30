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
function preAudit(html: string, meta: { title: string; image: string | null; metaTitle: string | null; metaDescription: string | null; faqCount: number; }) {
  const issues: string[] = [];
  const warnings: string[] = [];
  const stats: Record<string, number> = {};
  const len = html.length;
  stats.length = len;

  // Images
  const imgs = html.match(/<img[^>]+>/gi) || [];
  stats.images_inline = imgs.length;
  const noAlt = imgs.filter((i) => !/\balt\s*=\s*"[^"]+"/i.test(i));
  if (noAlt.length) warnings.push(`${noAlt.length}/${imgs.length} image(s) sans attribut alt (accessibilité + SEO image)`);
  const placeholders = imgs.filter((i) => /placeholder|lorempixel|example\.com/i.test(i));
  if (placeholders.length) issues.push(`${placeholders.length} image(s) placeholder à remplacer`);
  if (!meta.image) issues.push("Aucune image à la une (featured_image vide)");
  const extImgs = imgs.filter((i) => /src="https?:\/\//i.test(i) && !/supabase|lovable|prime-energies/i.test(i));
  if (extImgs.length) warnings.push(`${extImgs.length} image(s) hébergée(s) sur un domaine externe — risque de lien mort`);

  // Links
  const links = [...html.matchAll(/<a\b[^>]*href\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)];
  stats.links_total = links.length;
  const empty = links.filter((m) => m[1] === "" || m[1] === "#");
  if (empty.length) issues.push(`${empty.length} lien(s) avec href vide ou '#' (CTA inactif)`);
  const noText = links.filter((m) => !m[2].replace(/<[^>]+>/g, "").trim());
  if (noText.length) warnings.push(`${noText.length} lien(s) sans texte d'ancre`);
  const internal = links.filter((m) => m[1].startsWith("/") || /prime-energies\.fr/.test(m[1]));
  stats.links_internal = internal.length;
  stats.links_external = links.length - internal.length - empty.length;
  if (internal.length === 0 && len > 5000) issues.push("Aucun lien interne — maillage manquant");
  else if (internal.length < 3 && len > 8000) warnings.push(`Maillage interne faible (${internal.length} liens)`);

  // CTA banners detection
  const ctaBanners = [...html.matchAll(/<(div|section)[^>]*class\s*=\s*"[^"]*(cta|banner|bandeau)[^"]*"/gi)];
  stats.cta_banners = ctaBanners.length;

  // Tables
  const tables = html.match(/<table\b[\s\S]*?<\/table>/gi) || [];
  stats.tables = tables.length;
  if (tables.some((t) => !/<th\b/i.test(t))) warnings.push("Un tableau au moins n'a pas d'en-têtes <th> (accessibilité)");

  // Outdated facts (heuristic)
  const text = html.replace(/<[^>]+>/g, " ");
  const yearHits = [...text.matchAll(/\b(en|depuis|pour|dès|fin|début|courant|d[ée]but)\s+(202[3-5])\b/gi)];
  if (yearHits.length) {
    const years = [...new Set(yearHits.map((m) => m[2]))].sort();
    warnings.push(`Année(s) potentiellement périmée(s) référencée(s) : ${years.join(", ")} (${yearHits.length} occurrences)`);
  }
  if (/\bCITE\b/.test(text) && /cr[ée]dit d['']imp[oô]t/i.test(text)) {
    warnings.push("Mention du CITE (dispositif supprimé depuis 2021)");
  }
  if (/RE2025/.test(text)) warnings.push("Mention 'RE2025' incorrect (la norme reste RE2020)");
  if (/photovolta/i.test(text) && /MaPrimeR[ée]nov/i.test(text)) {
    warnings.push("MaPrimeRénov mentionnée pour le photovoltaïque — PV exclu de MPR, à vérifier");
  }

  // Meta
  if (!meta.metaTitle) issues.push("meta_title vide");
  else if (meta.metaTitle.length > 65) warnings.push(`meta_title trop long (${meta.metaTitle.length} car > 60)`);
  if (!meta.metaDescription) issues.push("meta_description vide");
  else if (meta.metaDescription.length > 165) warnings.push(`meta_description trop longue (${meta.metaDescription.length} car > 160)`);
  else if (meta.metaDescription.length < 100) warnings.push(`meta_description courte (${meta.metaDescription.length} car)`);
  if (meta.title.length > 75) warnings.push(`Titre long (${meta.title.length} car)`);
  if (/\btest+\b/i.test(meta.title)) issues.push("Titre contient 'test' (article test ?)");

  // FAQ
  if (meta.faqCount === 0 && len > 6000) warnings.push("Aucune FAQ — recommandé pour SEO et rich snippets");

  // Length
  if (len < 4000) issues.push(`Contenu trop court (${len} car) — risque de faible profondeur SEO`);
  else if (len < 7000) warnings.push(`Contenu court (${len} car) — viser 8 000+`);

  // Excessive emphasis / pas de structure h2
  const h2 = (html.match(/<h2\b/gi) || []).length;
  stats.h2_count = h2;
  if (h2 < 3 && len > 6000) warnings.push(`Seulement ${h2} <h2> — structurer davantage`);

  return { issues, warnings, stats };
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
    });

    // Audit-only mode : pas d'IA, juste le rapport heuristique
    if (mode === "audit_only") {
      return new Response(JSON.stringify({
        ok: true, post_id, title: post.title, slug: post.slug, changed: false,
        audit: {
          heuristic,
          interlinks_added: [], outdated_facts_corrected: [],
          remaining_issues: [...heuristic.issues, ...heuristic.warnings],
          quality_score: Math.max(0, 100 - heuristic.issues.length * 15 - heuristic.warnings.length * 5),
        },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 2) Fetch maillage candidates
    const { data: others } = await sb
      .from("posts")
      .select("slug,title,excerpt,content_type,categories:post_categories(category:categories(slug))")
      .eq("status", "published")
      .neq("id", post_id)
      .order("published_at", { ascending: false })
      .limit(40);

    const candidates = (others || [])
      .filter((p: any) => p.slug && p.title)
      .map((p: any) => `- "${p.title}" [${p.content_type}] → ${postUrl(p)}${p.excerpt ? ` | ${String(p.excerpt).slice(0, 120)}` : ""}`)
      .join("\n");

    const today = new Date().toISOString().slice(0, 10);
    const pubDate = post.published_at ? String(post.published_at).slice(0, 10) : "inconnu";

    const prompt = `Tu es éditeur SEO senior + fact-checker énergie/rénovation France. On est le ${today}. Article publié le ${pubDate}.

PROBLÈMES DÉJÀ DÉTECTÉS PAR L'AUDIT AUTO (corrige ce que tu peux) :
${[...heuristic.issues.map((i) => "❌ " + i), ...heuristic.warnings.map((w) => "⚠️ " + w)].join("\n") || "(aucun)"}

TÂCHES SUR LE CONTENU HTML (ordre obligatoire) :

A. MAILLAGE INTERNE — Insère 3 à 5 liens <a href="/URL"> contextuels VERS les articles listés ci-dessous (ancres descriptives, jamais "cliquez ici"). 1 lien max par paragraphe. Pas dans l'intro ni la conclusion.

B. BLOC "Pour aller plus loin" juste avant la FAQ ou la conclusion (2-3 articles différents) :
<div class="my-8 p-6 rounded-xl bg-muted/50 border border-border">
  <h3 class="text-lg font-semibold mb-3">Pour aller plus loin</h3>
  <ul class="space-y-2"><li>→ <a href="/URL">Titre</a></li></ul>
</div>

C. CTA / BOUTONS / LIENS CASSÉS — Tout <a href="#"> ou <a href=""> doit être :
   - soit transformé en lien interne pertinent (/aides, /simulateurs/solaire, /guides, autre article),
   - soit supprimé en gardant le texte.
   - Tout bouton CTA factice doit pointer vers /simulateurs/solaire (si sujet solaire/PV) ou /aides (si subventions) ou /contact sinon.

D. IMAGES — Ajoute un attribut alt descriptif à toute <img> qui n'en a pas (ne pas inventer une URL d'image, juste l'alt).

E. CHIFFRES & FAITS PÉRIMÉS — Repère et corrige :
   - dates "en 2023/2024/2025" qui doivent être actualisées ou neutralisées ("au barème en vigueur"),
   - barèmes obsolètes (MaPrimeRénov, CEE, tarifs d'achat EDF OA),
   - dispositifs supprimés (CITE, prime énergie ancien régime),
   - PV + MaPrimeRénov (PV exclu de MPR, ne garder que Prime à l'autoconsommation + TVA 10%),
   - chiffres invraisemblables (économies > 70%, ROI < 3 ans en métropole, etc.) → arrondir/borner.
   Ne PAS inventer de chiffres : si doute, formulation prudente ("plusieurs milliers d'euros", "selon le profil").

F. TABLEAUX — Si <table> sans <thead><th>, ajoute un en-tête approprié.

G. STRUCTURE — Si < 3 <h2>, scinde un paragraphe long en ajoutant un <h2> intermédiaire pertinent.

H. NE MODIFIE PAS : la FAQ existante, le ton général, les widgets data-*, le featured_image.

ARTICLES DISPONIBLES POUR MAILLAGE (URLs exactes obligatoires) :
${candidates}

ARTICLE — TITRE : ${post.title}
TYPE : ${post.content_type}

CONTENU HTML ACTUEL :
${post.content}

RÉPONDS EN JSON STRICT (rien d'autre) :
{
  "updated_content": "<html mis à jour intégralement>",
  "audit": {
    "interlinks_added": ["/url1"],
    "ctas_fixed": ["description"],
    "images_alt_added": 0,
    "outdated_facts_corrected": ["description"],
    "numbers_normalized": ["description"],
    "tables_fixed": 0,
    "remaining_issues": ["à vérifier humainement"],
    "veracity_flags": ["affirmation à fact-checker manuellement"],
    "quality_score": 0
  }
}`;

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
    const audit = { ...(parsed.audit || {}), heuristic };

    if (!dry_run && updated && updated !== post.content) {
      await sb.from("posts").update({ content: updated, updated_at: new Date().toISOString() }).eq("id", post_id);
    }

    return new Response(JSON.stringify({
      ok: true, post_id, title: post.title, slug: post.slug,
      changed: updated !== post.content, audit,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
