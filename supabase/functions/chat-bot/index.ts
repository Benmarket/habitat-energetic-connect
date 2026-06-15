import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// 🔒 LOCKED DOWN: Cette fonction n'appelle PLUS l'IA (LOVABLE_API_KEY).
// Le chat "Assistance en ligne" fonctionne uniquement via les tunnels/flows
// définis dans l'admin. Toute saisie libre renvoie un message statique
// invitant l'utilisateur à utiliser le menu ou à demander un agent.
// Cela évite tout drain de crédits API et toute exploitation type bot.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-visitor-token",
};

// Rate limit basique (anti-spam log/CPU)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 15;

function checkRateLimit(id: string): boolean {
  const now = Date.now();
  const r = rateLimitStore.get(id);
  if (!r || r.resetAt < now) {
    rateLimitStore.set(id, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (r.count >= RATE_LIMIT_MAX_REQUESTS) return false;
  r.count++;
  return true;
}

const FALLBACK_MESSAGE =
  "Merci pour votre message ! Pour mieux vous aider, utilisez le menu de l'assistant ou demandez à parler à un conseiller via le bouton dédié. Vous pouvez aussi nous joindre via le formulaire de contact.";

function sseFromText(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      // Format compatible avec le parser SSE OpenAI-like du client
      const payload = {
        choices: [{ delta: { content: text } }],
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const visitorToken = req.headers.get("x-visitor-token") || "";
    const clientIP =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const rateLimitKey = visitorToken
      ? `visitor:${visitorToken.substring(0, 16)}`
      : `ip:${clientIP}`;

    if (!checkRateLimit(rateLimitKey)) {
      return new Response(
        JSON.stringify({ error: "Trop de messages. Veuillez patienter avant de réessayer." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // On valide le format pour éviter les payloads abusifs, mais on n'envoie RIEN à l'IA
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      // ignore — on retourne quand même le fallback
    }
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    if (messages.length > 50) {
      return new Response(JSON.stringify({ error: "Trop de messages dans la conversation" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(sseFromText(FALLBACK_MESSAGE), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat-bot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
