// Enrich an existing post: add internal interlinks + run editorial audit.
// Admin-only. One post at a time.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireAuth(req, { corsHeaders, requireAdmin: true });
  if (!auth.ok) return auth.response;

  try {
    const { post_id, dry_run = false } = await req.json();
    if (!post_id) {
      return new Response(JSON.stringify({ error: "post_id requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: post, error: pErr } = await sb
      .from("posts")
      .select("id,slug,title,content,content_type,published_at,featured_image")
      .eq("id", post_id)
      .maybeSingle();
    if (pErr || !post) {
      return new Response(JSON.stringify({ error: "Post introuvable" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const prompt = `Tu es éditeur SEO senior. On est le ${today}. Voici un article publié le ${pubDate}.

TÂCHES :
1. Insère 3 à 5 liens internes HTML <a href="/URL"> contextuels VERS les articles ci-dessous, là où c'est NATUREL et PERTINENT (ancres descriptives, jamais "cliquez ici", jamais le titre brut). Maximum 1 lien par paragraphe. Pas d'ancre dans l'intro ni la conclusion.
2. Juste avant la FAQ (ou avant la conclusion si pas de FAQ), ajoute un bloc HTML "Pour aller plus loin" listant 2 à 3 articles connexes (DIFFÉRENTS de ceux déjà liés en inline) :
<div class="my-8 p-6 rounded-xl bg-muted/50 border border-border">
  <h3 class="text-lg font-semibold mb-3">Pour aller plus loin</h3>
  <ul class="space-y-2">
    <li>→ <a href="/URL">Titre</a></li>
  </ul>
</div>
3. NE MODIFIE PAS le reste du contenu (texte, CTA, images, FAQ existante). Conserve tous les data-* attributs et widgets.
4. Si l'article contient des informations factuellement PÉRIMÉES (ex : "RE2025 à venir" alors qu'on est en ${today}, MaPrimeRénov barèmes 2024, "prochaine baisse en juillet"), corrige-les ou neutralise-les en formulation indéfinie (ex : "au barème en vigueur"). NE PAS inventer de chiffres : préférer une formulation prudente.
5. Renvoie un audit court séparé.

ARTICLES DISPONIBLES POUR MAILLAGE (utilise UNIQUEMENT ces URLs exactes) :
${candidates}

ARTICLE ACTUEL — TITRE : ${post.title}
TYPE : ${post.content_type}

CONTENU HTML ACTUEL :
${post.content}

RÉPONDS EN JSON STRICT (rien d'autre) :
{
  "updated_content": "<html mis à jour intégralement>",
  "audit": {
    "interlinks_added": ["/url1", "/url2"],
    "outdated_facts_corrected": ["description courte"],
    "remaining_issues": ["points à vérifier humainement (chiffres douteux, images manquantes, CTA absents...)"],
    "quality_score": 0-100
  }
}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_KEY}`,
        "Content-Type": "application/json",
      },
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
    const audit = parsed.audit || {};

    if (!dry_run && updated && updated !== post.content) {
      await sb.from("posts").update({ content: updated, updated_at: new Date().toISOString() }).eq("id", post_id);
    }

    return new Response(JSON.stringify({
      ok: true,
      post_id,
      title: post.title,
      slug: post.slug,
      changed: updated !== post.content,
      audit,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
