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
    const { keywords, contentType, baseContent, additionalInstructions } = await req.json();
    
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

    const systemPrompt = `Tu es un expert en rédaction SEO et en énergies renouvelables spécialisé dans la création d'articles VIRAUX.

STRUCTURE DE L'ARTICLE (HTML uniquement) :
1. UN SEUL H1 accrocheur et viral (max 60 caractères)
2. Introduction engageante (150-200 mots) avec le problème/bénéfice principal
3. 3-5 sections avec H2 contenant les mots-clés
4. Sous-sections H3 si nécessaire
5. Listes à puces <ul><li> pour faciliter la lecture
6. Au moins 2 suggestions d'images avec descriptions entre [IMAGE: description détaillée]
7. 2-3 boutons CTA stratégiquement placés avec cette structure HTML exacte : <div class="my-4"><a href="#contact" class="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-colors">Texte du bouton</a></div>
8. Paragraphes courts (3-4 lignes max) pour la lisibilité
9. Utilise <strong> pour les mots-clés importants
10. Inclus des statistiques/chiffres si pertinent

OPTIMISATION VIRALE :
- Titre émotionnel et accrocheur
- Promesse claire dès l'intro
- Storytelling et exemples concrets
- Call-to-actions puissants
- Contenu entre 1000-1500 mots
- Ton conversationnel mais expert

IMPORTANT : Retourne UNIQUEMENT le HTML pur sans balises markdown, sans commentaires, sans explications. Le HTML doit être parfaitement formaté et lisible.`;

    const contentTypeLabel = contentTypeLabels[contentType as keyof typeof contentTypeLabels] || 'article';
    const keywordsText = keywords.join(', ');
    
    let userPrompt = `Crée un ${contentTypeLabel} VIRAL et complet sur : ${keywordsText}.

MOTS-CLÉS À INTÉGRER : ${keywordsText}

Objectifs de cet article :
- Captiver dès le titre
- Résoudre un problème concret
- Inclure des images avec [IMAGE: description détaillée]
- Avoir 2-3 boutons CTA stratégiques
- Être optimisé SEO avec mots-clés naturels
- Format HTML pur prêt à publier

STRUCTURE EXEMPLE :
<h1>Titre viral</h1>
<p>Intro percutante...</p>
[IMAGE: description de image hero]
<h2>Première section avec mot-clé</h2>
<p>Contenu...</p>
<ul><li>Point important</li></ul>
<div class="my-4"><a href="#contact" class="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium transition-colors">Texte CTA</a></div>

Retourne UNIQUEMENT le HTML sans balises de code ni commentaires.`;

    // Si on a des instructions additionnelles pour régénérer une variante
    if (additionalInstructions) {
      userPrompt += `\n\nINSTRUCTIONS ADDITIONNELLES IMPORTANTES À SUIVRE :\n${additionalInstructions}`;
      
      if (baseContent) {
        userPrompt += `\n\nCONTENU DE BASE À AMÉLIORER :\n${baseContent.substring(0, 2000)}...\n\nAMÉLIORE ce contenu en suivant les instructions ci-dessus.`;
      }
    }

    console.log('Calling OpenAI API with:', { apiUrl, model, keywordsCount: keywords.length });

    // Générer les variantes
    let variants;
    if (additionalInstructions && baseContent) {
      // Régénération d'une seule variante avec instructions
      const regeneratedContent = await generateVariant(apiUrl, model, OPENAI_API_KEY, systemPrompt, userPrompt);
      variants = [regeneratedContent];
    } else {
      // Génération initiale : 2 variantes différentes
      variants = await Promise.all([
        generateVariant(apiUrl, model, OPENAI_API_KEY, systemPrompt, userPrompt + "\n\nVARIANTE 1 : Ton pédagogique, accessible au grand public, beaucoup d'exemples concrets et de bénéfices chiffrés."),
        generateVariant(apiUrl, model, OPENAI_API_KEY, systemPrompt, userPrompt + "\n\nVARIANTE 2 : Ton plus technique et expert, focus sur l'expertise et la crédibilité, données précises et arguments d'autorité.")
      ]);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        variants: variants.map((content, index) => {
          const cleanContent = cleanHtml(content);
          return {
            id: index + 1,
            title: extractTitle(cleanContent),
            content: cleanContent,
            excerpt: generateExcerpt(cleanContent),
            metaTitle: extractMetaTitle(cleanContent, keywords),
            metaDescription: extractMetaDescription(cleanContent),
            focusKeywords: keywords,
            featuredImageDescription: extractFirstImageDescription(cleanContent)
          };
        })
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

function cleanHtml(htmlContent: string): string {
  // Nettoyer le contenu HTML des balises de code markdown
  let cleaned = htmlContent
    .replace(/```html\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  
  // Nettoyer les entités HTML mal formées
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  return cleaned;
}

function extractTitle(htmlContent: string): string {
  const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) {
    return h1Match[1].replace(/<[^>]*>/g, '').trim();
  }
  
  const firstLine = htmlContent.split('\n')[0];
  return firstLine.replace(/<[^>]*>/g, '').trim().slice(0, 100);
}

function extractMetaTitle(htmlContent: string, keywords: string[]): string {
  const title = extractTitle(htmlContent);
  // Limiter à 60 caractères max pour le SEO
  if (title.length <= 60) return title;
  
  // Essayer d'inclure le premier mot-clé
  const firstKeyword = keywords[0];
  const shortTitle = title.slice(0, 60);
  if (shortTitle.includes(firstKeyword)) {
    return shortTitle.slice(0, shortTitle.lastIndexOf(' ')) + '...';
  }
  
  return title.slice(0, 57) + '...';
}

function extractMetaDescription(htmlContent: string): string {
  // Extraire le premier paragraphe après le H1
  const textOnly = htmlContent
    .replace(/<h1[^>]*>.*?<\/h1>/gi, '')
    .replace(/\[IMAGE:.*?\]/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Limiter à 160 caractères pour le SEO
  if (textOnly.length <= 160) return textOnly;
  return textOnly.slice(0, 157) + '...';
}

function generateExcerpt(htmlContent: string): string {
  const textOnly = htmlContent
    .replace(/<h1[^>]*>.*?<\/h1>/gi, '')
    .replace(/\[IMAGE:.*?\]/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return textOnly.slice(0, 200) + (textOnly.length > 200 ? '...' : '');
}

function extractFirstImageDescription(htmlContent: string): string {
  const imageMatch = htmlContent.match(/\[IMAGE:\s*([^\]]+)\]/i);
  if (imageMatch) {
    return imageMatch[1].trim();
  }
  return 'Image représentant le sujet de l\'article';
}
