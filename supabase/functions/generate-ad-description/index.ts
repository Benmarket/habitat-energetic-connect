import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { title, advertiserName, price, features, currentDescription, regenerate } = await req.json();

    if (!title) {
      return new Response(JSON.stringify({ error: "Le titre est requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Configuration AI manquante" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context for the AI
    const contextParts: string[] = [];
    if (advertiserName) contextParts.push(`Annonceur: ${advertiserName}`);
    if (price) contextParts.push(`Prix: ${price}€`);
    if (currentDescription && regenerate) {
      contextParts.push(`Description actuelle à réécrire différemment: ${currentDescription}`);
    }
    if (features && features.length > 0 && regenerate) {
      contextParts.push(`Avantages actuels à réécrire différemment: ${features.join(", ")}`);
    }

    const contextInfo = contextParts.length > 0 ? `\n\nInformations disponibles:\n${contextParts.join("\n")}` : "";

    const systemPrompt = `Tu es un expert en rédaction marketing pour le secteur des énergies renouvelables en France (panneaux solaires, pompes à chaleur, isolation thermique, etc.).

Ta mission: Rédiger une description d'offre commerciale ET une liste d'avantages percutants et professionnels.

Règles pour la DESCRIPTION:
- 2 à 4 phrases maximum (environ 150-250 caractères)
- Ton professionnel mais accessible
- Mettre en avant les bénéfices client (économies, confort, écologie)
- Inclure un élément de crédibilité si possible (certification, garantie, expertise)
- Pas de phrases trop longues ni de jargon technique excessif
- Pas d'emojis
- Pas de prix dans la description (il est affiché séparément)

Règles pour les AVANTAGES:
- Exactement 4 à 6 avantages courts et percutants
- Chaque avantage doit être une phrase courte (5-10 mots max)
- Commencer par un verbe d'action ou un bénéfice concret
- Exemples: "Installation garantie 10 ans", "Économies jusqu'à 70% sur la facture", "Certification RGE", "Accompagnement démarches administratives"
- Pas d'emojis

${regenerate ? "IMPORTANT: Propose un style et une approche DIFFÉRENTS du contenu actuel." : ""}

Réponds UNIQUEMENT au format JSON suivant (pas de texte avant ou après):
{
  "description": "La description ici",
  "features": ["Avantage 1", "Avantage 2", "Avantage 3", "Avantage 4"]
}`;

    const userPrompt = `Génère une description et des avantages pour cette offre: "${title}"${contextInfo}`;

    console.log("Generating ad content for:", title);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, veuillez réessayer plus tard." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Erreur du service AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim() || "";

    if (!rawContent) {
      return new Response(JSON.stringify({ error: "Aucun contenu généré" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse JSON response
    let parsedContent: { description: string; features: string[] };
    try {
      // Remove markdown code blocks if present
      const cleanedContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedContent = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", rawContent);
      // Fallback: use raw content as description with empty features
      parsedContent = {
        description: rawContent,
        features: []
      };
    }

    console.log("Generated content:", {
      description: parsedContent.description?.substring(0, 100) + "...",
      featuresCount: parsedContent.features?.length || 0
    });

    return new Response(JSON.stringify({
      description: parsedContent.description || "",
      features: parsedContent.features || []
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating ad content:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
