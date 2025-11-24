import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keywords, contentType } = await req.json();
    
    if (!keywords || keywords.length === 0) {
      throw new Error('Au moins un mot-clé est requis');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Récupérer la configuration depuis site_settings
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/site_settings?select=*&key=in.(ai_generation_api_url,ai_generation_model,ai_generation_enabled)`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    });
    
    const settings = await settingsResponse.json();
    const apiUrl = settings.find((s: any) => s.key === 'ai_generation_api_url')?.value || "https://api.openai.com/v1/chat/completions";
    const model = settings.find((s: any) => s.key === 'ai_generation_model')?.value || "gpt-4o-mini";
    const enabled = settings.find((s: any) => s.key === 'ai_generation_enabled')?.value ?? true;

    if (!enabled) {
      throw new Error('La génération d\'articles par IA est désactivée');
    }

    const contentTypeLabels = {
      actualite: "actualité",
      guide: "guide pratique",
      aide: "article sur les aides et subventions"
    };

    const systemPrompt = `Tu es un expert en rédaction SEO et en énergies renouvelables. Tu dois créer un article optimisé pour le référencement naturel (SEO) et pour les moteurs de recherche d'IA comme ChatGPT.

L'article doit :
- Être structuré avec un titre H1 accrocheur
- Contenir des sous-titres H2 et H3 pertinents
- Inclure naturellement tous les mots-clés fournis
- Être rédigé en HTML avec les balises appropriées (<h1>, <h2>, <h3>, <p>, <strong>, <em>, <ul>, <ol>, <li>)
- Avoir entre 800 et 1200 mots
- Être informatif, précis et engageant
- Optimisé pour le référencement local (France)

IMPORTANT : Ne fournis QUE le contenu HTML de l'article, sans aucune explication ou commentaire supplémentaire.`;

    const userPrompt = `Rédige un ${contentTypeLabels[contentType as keyof typeof contentTypeLabels] || 'article'} complet et optimisé SEO en utilisant ces mots-clés : ${keywords.join(', ')}.

L'article doit être au format HTML pur (avec les balises <h1>, <h2>, <h3>, <p>, <strong>, etc.) et être prêt à être publié sur un site web professionnel dans le domaine des énergies renouvelables et des économies d'énergie.`;

    console.log('Calling OpenAI API with:', { apiUrl, model, keywordsCount: keywords.length });

    // Générer 2 variantes
    const variants = await Promise.all([
      generateVariant(apiUrl, model, OPENAI_API_KEY, systemPrompt, userPrompt + "\n\nVariante 1: Adopte un ton pédagogique et accessible."),
      generateVariant(apiUrl, model, OPENAI_API_KEY, systemPrompt, userPrompt + "\n\nVariante 2: Adopte un ton plus technique et expert.")
    ]);

    return new Response(
      JSON.stringify({ 
        success: true,
        variants: variants.map((content, index) => ({
          id: index + 1,
          title: extractTitle(content),
          content: content,
          excerpt: generateExcerpt(content)
        }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in generate-article:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function generateVariant(
  apiUrl: string, 
  model: string, 
  apiKey: string, 
  systemPrompt: string, 
  userPrompt: string
): Promise<string> {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4096,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    throw new Error(`Erreur API OpenAI: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function extractTitle(htmlContent: string): string {
  const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) {
    return h1Match[1].replace(/<[^>]*>/g, '').trim();
  }
  
  const firstLine = htmlContent.split('\n')[0];
  return firstLine.replace(/<[^>]*>/g, '').trim().slice(0, 100);
}

function generateExcerpt(htmlContent: string): string {
  const textOnly = htmlContent
    .replace(/<h1[^>]*>.*?<\/h1>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return textOnly.slice(0, 200) + (textOnly.length > 200 ? '...' : '');
}