// Relit un article via une IA puissante et renvoie un rapport qualité.
// Deux modes :
//  - { postId } : lit le post en base, tourne en arrière-plan, écrit dans `article_quality_reviews`.
//  - { article: { title, content, meta_title, meta_description, excerpt } } :
//      relecture d'un draft juste après génération, retourne le rapport dans la réponse.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const MODEL = "openai/gpt-5.5";

function stripHtml(html: string): string {
  return (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SYSTEM = `Tu es un rédacteur en chef SEO et fact-checker exigeant, spécialisé dans la rénovation énergétique et le solaire photovoltaïque en France. Tu relis un article Prime Energies.
Note sur 100 :
- factual (véracité, cohérence des chiffres, mentions d'aides — MaPrimeRenov, CEE, TVA, éco-PTZ),
- editorial (clarté, ton, structure, orthographe),
- seo (title/meta description, densité mots-clés, titres Hn, maillage),
- compliance (DGCCRF, pas de promesses trompeuses "gratuit/0€/100%", conditionnel pour les aides, pas de personnes réelles).
Verdict : excellent | bon | à revoir | non conforme.`;

function buildUserPrompt(a: { title?: string; excerpt?: string; content?: string; meta_title?: string; meta_description?: string }) {
  const plain = stripHtml(a.content || "").slice(0, 12000);
  return `TITRE: ${a.title || ""}\nMETA TITLE: ${a.meta_title || ""}\nMETA DESCRIPTION: ${a.meta_description || ""}\nEXTRAIT: ${a.excerpt || ""}\n\nCONTENU (texte brut):\n${plain}\n\nRéponds UNIQUEMENT en JSON valide :\n{\n  "overall_score": number,\n  "verdict": "excellent"|"bon"|"à revoir"|"non conforme",\n  "seo_score": number,\n  "factual_score": number,\n  "editorial_score": number,\n  "compliance_score": number,\n  "summary": string,\n  "issues": [{"severity":"critical"|"major"|"minor","area":"seo"|"factual"|"editorial"|"compliance","message":string,"excerpt":string}],\n  "suggestions": [string],\n  "warnings": [string]\n}`;
}

async function runReview(article: any) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: buildUserPrompt(article) },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`AI ${resp.status}: ${txt.slice(0, 200)}`);
  }
  const data = await resp.json();
  const raw = data?.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : {};
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { postId, article } = body || {};

    // Mode 1 — payload direct (juste après génération) : réponse inline
    if (!postId && article) {
      const parsed = await runReview(article);
      return new Response(
        JSON.stringify({ success: true, review: parsed, model: MODEL }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!postId) {
      return new Response(JSON.stringify({ error: "postId or article required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Mode 2 — postId : tâche de fond, persistance en DB
    const { data: existing } = await admin
      .from("article_quality_reviews")
      .select("id")
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let reviewId = existing?.id;
    if (!reviewId) {
      const { data: inserted, error: insErr } = await admin
        .from("article_quality_reviews")
        .insert({ post_id: postId, status: "pending" })
        .select("id")
        .single();
      if (insErr) throw insErr;
      reviewId = inserted.id;
    } else {
      await admin
        .from("article_quality_reviews")
        .update({ status: "pending", error_message: null })
        .eq("id", reviewId);
    }

    const bgTask = (async () => {
      try {
        const { data: post, error: pErr } = await admin
          .from("posts")
          .select("id, title, excerpt, content, meta_description, meta_title, content_type")
          .eq("id", postId)
          .maybeSingle();
        if (pErr || !post) throw new Error("Post introuvable");

        const parsed = await runReview(post);
        await admin
          .from("article_quality_reviews")
          .update({
            status: "done",
            overall_score: Number(parsed.overall_score) || null,
            verdict: parsed.verdict || null,
            seo_score: Number(parsed.seo_score) || null,
            factual_score: Number(parsed.factual_score) || null,
            editorial_score: Number(parsed.editorial_score) || null,
            compliance_score: Number(parsed.compliance_score) || null,
            summary: parsed.summary || null,
            issues: Array.isArray(parsed.issues) ? parsed.issues : [],
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
            warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
            model: MODEL,
          })
          .eq("id", reviewId);
      } catch (e) {
        await admin
          .from("article_quality_reviews")
          .update({ status: "error", error_message: String(e).slice(0, 500) })
          .eq("id", reviewId);
      }
    })();

    // @ts-ignore
    if (typeof EdgeRuntime !== "undefined" && (EdgeRuntime as any).waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(bgTask);
    } else {
      bgTask.catch(() => {});
    }

    return new Response(JSON.stringify({ success: true, reviewId }), {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
