import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { regionCode, regionName, variantSlug } = await req.json();

    if (!regionCode || !regionName) {
      return new Response(
        JSON.stringify({ error: 'regionCode et regionName requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY non configurée' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isBatterie = variantSlug === 'photovoltaique-batterie';
    const productLabel = isBatterie ? 'panneaux solaires avec batterie de stockage' : 'panneaux solaires photovoltaïques';
    const currentYear = new Date().getFullYear();

    const systemPrompt = `Tu es un expert en énergie solaire photovoltaïque en France. Tu génères du contenu SEO optimisé, factuel et à jour pour des landing pages régionales.

RÈGLES STRICTES :
- Utilise UNIQUEMENT des données vérifiables et sourcées
- MaPrimeRénov' ne s'applique PAS au solaire photovoltaïque (seulement au thermique)
- Utilise le conditionnel pour les montants d'aides ("pourrait atteindre", "jusqu'à")
- Terminologie française : kWc (pas kWp), € (pas EUR)
- Les aides doivent inclure l'année de validité (${currentYear})
- Ne pas inventer de données d'ensoleillement, utiliser des fourchettes réalistes
- Les témoignages doivent être réalistes et variés (prénoms courants de la région)`;

    const userPrompt = `Génère le contenu complet pour une landing page "${productLabel}" dans la région "${regionName}" (code: ${regionCode}).

Retourne un JSON avec cette structure EXACTE (pas de markdown, juste le JSON) :
{
  "hero_title": "titre accrocheur avec ${regionName}, max 70 caractères",
  "hero_subtitle": "sous-titre persuasif mentionnant les économies, max 150 caractères",
  "context": {
    "title": "Pourquoi installer des ${productLabel} en ${regionName} ?",
    "intro_text": "paragraphe de 2-3 phrases sur le potentiel solaire de ${regionName} avec données d'ensoleillement réalistes",
    "highlights": [
      {"icon": "Sun", "label": "Ensoleillement", "value": "valeur réaliste en h/an", "description": "courte explication"},
      {"icon": "TrendingUp", "label": "Production", "value": "kWh/kWc/an réaliste", "description": "explication"},
      {"icon": "Euro", "label": "Économies", "value": "montant annuel moyen", "description": "explication"}
    ]
  },
  "profitability": {
    "title": "Rentabilité solaire en ${regionName}",
    "intro_text": "2 phrases sur la rentabilité avec données chiffrées",
    "roi_years": nombre réaliste entre 6 et 12,
    "annual_production_kwh": production réaliste pour 3kWc,
    "savings_25_years": "montant en euros sur 25 ans",
    "comparison_text": "comparaison avec la moyenne nationale"
  },
  "aids": {
    "title": "Aides et primes solaires en ${regionName} (${currentYear})",
    "intro_text": "phrase d'intro sur les aides disponibles",
    "items": [
      {"name": "nom de l'aide", "amount": "montant", "description": "description courte", "is_local": false, "year": ${currentYear}},
      ... (4-6 aides, mix nationales et locales si applicable)
    ]
  },
  "testimonials": [
    {"text": "témoignage réaliste de 2-3 phrases", "name": "Prénom P.", "location": "ville de ${regionName}"},
    {"text": "autre témoignage", "name": "Prénom P.", "location": "ville de ${regionName}"},
    {"text": "autre témoignage", "name": "Prénom P.", "location": "ville de ${regionName}"}
  ],
  "faq": [
    {"question": "question SEO pertinente pour ${regionName}", "answer": "réponse détaillée de 2-3 phrases"},
    ... (5 questions)
  ],
  "seo": {
    "meta_title": "titre SEO <60 car avec ${regionName}",
    "meta_description": "meta description <160 car",
    "h1": "H1 optimisé avec ${regionName}",
    "focus_keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3"]
  },
  "dynamic_vars": {
    "clients_count": nombre réaliste,
    "installations_count": nombre réaliste,
    "average_rating": note entre 4.5 et 4.9
  }
}`;

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
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte, réessayez dans quelques minutes." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", status, errorText);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = rawContent;
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const regionalContent = JSON.parse(jsonStr);

    return new Response(
      JSON.stringify({ success: true, content: regionalContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error generating regional content:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
