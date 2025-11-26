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
    const { keywords, contentType, baseContent, additionalInstructions, customInstructions } = await req.json();
    
    console.log('Request received:', { 
      keywords, 
      contentType, 
      hasBaseContent: !!baseContent,
      hasAdditionalInstructions: !!additionalInstructions,
      hasCustomInstructions: !!customInstructions,
      additionalInstructions: additionalInstructions?.substring(0, 100)
    });
    
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

    const systemPrompt = `Tu es un rédacteur SEO expert spécialisé dans les énergies renouvelables et les aides gouvernementales.
Tu dois créer un article viral et très bien optimisé pour le SEO, les recherches IA (ChatGPT, Gemini, etc.) et le GEO (Google Enhanced Optimization).

STRUCTURE OBLIGATOIRE:
1. Un titre H1 accrocheur et optimisé SEO (70 caractères max)
2. **Un bloc "EN RÉSUMÉ" (TL;DR)** au tout début - 3-4 points clés en liste à puces dans un <div class="summary-box">
3. Une introduction captivante (150-200 mots) qui présente le sujet
4. Le contenu principal structuré en H2 et H3, avec des paragraphes courts et aérés
5. Au moins 2-3 listes à puces ou numérotées pour la lisibilité
6. Des données chiffrées PRÉCISES et sources citées (organisme, année)
7. **Une section FAQ avec 3-5 questions-réponses** en H2 "Questions fréquentes"
8. **Une section SOURCES** en fin d'article listant les références citées
9. Une conclusion percutante avec appel à l'action

FORMAT DU BLOC RÉSUMÉ (au tout début après le titre):
<div class="summary-box" style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 1.5rem; margin: 2rem 0;">
  <h2 style="margin-top: 0; color: #0284c7; font-size: 1.25rem;">📌 En résumé</h2>
  <ul>
    <li><strong>Point clé 1</strong>: Description concise</li>
    <li><strong>Point clé 2</strong>: Description concise</li>
    <li><strong>Point clé 3</strong>: Description concise</li>
  </ul>
</div>

FORMAT DE LA SECTION FAQ (à la fin de l'article, AVANT les sources):
<h2>Questions fréquentes</h2>
<div class="faq-item">
  <h3>Question 1 ?</h3>
  <p>Réponse claire et précise avec données chiffrées si possible.</p>
</div>
[Répéter pour 3-5 questions]

FORMAT DES SOURCES (tout à la fin):
<h2>Sources et références</h2>
<ul class="sources-list">
  <li><strong>ADEME</strong> - Chiffres clés des énergies renouvelables, 2024</li>
  <li><strong>Ministère de la Transition Écologique</strong> - Guide MaPrimeRénov', 2024</li>
</ul>

OPTIMISATION SEO & GEO:
- Utilise les mots-clés naturellement (densité 1-2%)
- Réponds aux questions que les gens posent vraiment
- Cite des sources officielles (ADEME, Ministères, INSEE)
- Intègre des données chiffrées précises avec années
- Utilise un ton conversationnel et accessible
- Intègre des questions rhétoriques
- Structure en pyramide inversée (info importante en premier)

FORMATAGE:
- N'utilise PAS de balises markdown (pas de \`\`\`html)
- Utilise uniquement du HTML pur et valide
- Chaque paragraphe doit être dans des balises <p>
- Les listes doivent être dans <ul> ou <ol>
- Les titres en <h2> et <h3>

IMAGES:
- Tu DOIS inclure exactement 2-3 images pertinentes
- Format pour chaque image: [IMAGE: Description détaillée en français de l'image souhaitée]
- Place les images de manière stratégique dans l'article
- Les descriptions doivent être riches et précises

BOUTONS CTA:
- Tu DOIS inclure 2-3 boutons d'appel à l'action pertinents
- Format: [BUTTON: Texte du bouton | #contact]
- Utilise des textes accrocheurs: "Recevoir mon étude gratuite", "Calculer mes économies", "Profiter des aides"
- Place-les stratégiquement (milieu et fin d'article)

LONGUEUR: Minimum 1000 mots, idéalement 1200-1800 mots.

IMPORTANT : 
- Retourne UNIQUEMENT le HTML pur sans balises markdown, sans commentaires, sans explications
- TOUS les boutons doivent être au format [BUTTON:Texte|URL]
- TOUTES les images et boutons seront automatiquement CENTRÉS
- Le HTML doit être parfaitement formaté et lisible
- Le bloc TL;DR et la section FAQ sont OBLIGATOIRES`;

    // Ajouter les instructions personnalisées au system prompt si elles existent
    let finalSystemPrompt = systemPrompt;
    if (customInstructions && customInstructions.trim()) {
      finalSystemPrompt += `\n\nINSTRUCTIONS PERSONNALISÉES SUPPLÉMENTAIRES :\n${customInstructions}`;
    }

    const contentTypeLabel = contentTypeLabels[contentType as keyof typeof contentTypeLabels] || 'article';
    const keywordsText = keywords.join(', ');
    
    let userPrompt = `Crée un ${contentTypeLabel} VIRAL et complet sur : ${keywordsText}.

MOTS-CLÉS À INTÉGRER : ${keywordsText}

Objectifs de cet article :
- Captiver dès le titre
- Résoudre un problème concret
- Inclure des images CENTRÉES avec [IMAGE: description détaillée]
- Avoir 2-3 boutons CTA CENTRÉS stratégiques
- Être optimisé SEO avec mots-clés naturels
- Format HTML pur prêt à publier

STRUCTURE EXEMPLE :
<h1>Titre viral</h1>
<p>Intro percutante...</p>
[IMAGE: description de image hero]
<h2>Première section avec mot-clé</h2>
<p>Contenu...</p>
<ul><li>Point important</li></ul>
[BUTTON:Demander un devis gratuit|#contact]
<h2>Deuxième section</h2>
<p>Contenu...</p>
[BUTTON:En savoir plus|#info]

IMPORTANT : Utilise UNIQUEMENT le format [BUTTON:Texte|URL] pour les boutons.
Retourne UNIQUEMENT le HTML sans balises de code ni commentaires.`;

    // Si on a des instructions additionnelles pour régénérer une variante
    if (additionalInstructions) {
      userPrompt += `\n\nINSTRUCTIONS ADDITIONNELLES IMPORTANTES À SUIVRE :\n${additionalInstructions}`;
      
      if (baseContent) {
        userPrompt += `\n\nCONTENU DE BASE À AMÉLIORER :\n${baseContent.substring(0, 2000)}...\n\nAMÉLIORE ce contenu en suivant les instructions ci-dessus.`;
      }
    }

    console.log('Calling OpenAI API with:', { 
      apiUrl, 
      model, 
      keywordsCount: keywords.length,
      isRegeneration: !!(additionalInstructions && baseContent),
      hasCustomInstructions: !!customInstructions
    });

    // Générer les variantes
    let variants;
    if (additionalInstructions) {
      console.log('Regenerating with instructions:', additionalInstructions.substring(0, 200));
      // Régénération d'une seule variante avec instructions
      const regeneratedContent = await generateVariant(apiUrl, model, OPENAI_API_KEY, finalSystemPrompt, userPrompt);
      variants = [regeneratedContent];
    } else {
      console.log('Generating 2 initial variants');
      // Génération initiale : 2 variantes différentes
      variants = await Promise.all([
        generateVariant(apiUrl, model, OPENAI_API_KEY, finalSystemPrompt, userPrompt + "\n\nVARIANTE 1 : Ton pédagogique, accessible au grand public, beaucoup d'exemples concrets et de bénéfices chiffrés."),
        generateVariant(apiUrl, model, OPENAI_API_KEY, finalSystemPrompt, userPrompt + "\n\nVARIANTE 2 : Ton plus technique et expert, focus sur l'expertise et la crédibilité, données précises et arguments d'autorité.")
      ]);
    }
    
    console.log('Variants generated successfully:', variants.length);

    return new Response(
      JSON.stringify({ 
        success: true,
        variants: variants.map((content, index) => {
          const cleanContent = cleanHtml(content);
          const extractedFaq = extractFaq(cleanContent);
          const extractedTldr = extractTldr(cleanContent);
          
          return {
            id: index + 1,
            title: extractTitle(cleanContent),
            content: cleanContent,
            excerpt: generateExcerpt(cleanContent),
            metaTitle: extractMetaTitle(cleanContent, keywords),
            metaDescription: extractMetaDescription(cleanContent),
            focusKeywords: keywords,
            tldr: extractedTldr,
            faq: extractedFaq,
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
  
  // Convertir les boutons au format [BUTTON:Text|URL] en structure TipTap
  cleaned = convertButtonsToCustomFormat(cleaned);
  
  // Centrer toutes les images
  cleaned = centerImages(cleaned);
  
  return cleaned;
}

function convertButtonsToCustomFormat(htmlContent: string): string {
  // Convertir les balises [BUTTON:Text|URL] en structure TipTap professionnelle
  const buttonRegex = /\[BUTTON:([^\|]+)\|([^\]]+)\]/g;
  
  return htmlContent.replace(buttonRegex, (match, text, url) => {
    const buttonStyle = [
      'background-color: #10b981',
      'color: #ffffff',
      'padding: 12px 24px',
      'border-radius: 6px',
      'font-size: 16px',
      'font-weight: 500',
      'text-decoration: none',
      'display: inline-block',
      'transition: all 0.2s ease',
      'border: none',
      'cursor: pointer',
      'width: auto',
      'text-align: center',
      'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    ].join('; ');
    
    return `<div data-custom-button class="custom-button-wrapper my-4" style="text-align: center">
  <a href="${url.trim()}" style="${buttonStyle}" target="_blank" rel="noopener noreferrer" data-button-text="${text.trim()}" data-button-color="#10b981">
    ${text.trim()}
  </a>
</div>`;
  });
}

function centerImages(htmlContent: string): string {
  // Centrer toutes les balises <img> en les enveloppant dans un div centré
  return htmlContent.replace(
    /<img([^>]*)>/g,
    '<div style="text-align: center; margin: 1.5rem 0;"><img$1 style="max-width: 100%; height: auto; border-radius: 8px;"></div>'
  );
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

function extractTldr(htmlContent: string): string {
  // Extraire le contenu de la div summary-box
  const summaryBoxMatch = htmlContent.match(/<div class="summary-box"[^>]*>(.*?)<\/div>/is);
  if (!summaryBoxMatch) return '';
  
  const summaryContent = summaryBoxMatch[1];
  // Extraire le texte des éléments <li>
  const listItems = summaryContent.match(/<li[^>]*>(.*?)<\/li>/gis);
  if (!listItems) return '';
  
  return listItems
    .map(item => item.replace(/<[^>]*>/g, '').trim())
    .join('\n')
    .trim();
}

function extractFaq(htmlContent: string): Array<{ question: string; answer: string }> {
  const faq: Array<{ question: string; answer: string }> = [];
  
  // Chercher la section FAQ
  const faqSectionMatch = htmlContent.match(/<h2[^>]*>Questions fréquentes<\/h2>(.*?)(?=<h2|$)/is);
  if (!faqSectionMatch) return faq;
  
  const faqSection = faqSectionMatch[1];
  
  // Extraire chaque paire question-réponse
  const faqItems = faqSection.match(/<div class="faq-item"[^>]*>(.*?)<\/div>/gis);
  if (!faqItems) return faq;
  
  faqItems.forEach(item => {
    const questionMatch = item.match(/<h3[^>]*>(.*?)<\/h3>/is);
    const answerMatch = item.match(/<p[^>]*>(.*?)<\/p>/is);
    
    if (questionMatch && answerMatch) {
      faq.push({
        question: questionMatch[1].replace(/<[^>]*>/g, '').trim(),
        answer: answerMatch[1].replace(/<[^>]*>/g, '').trim()
      });
    }
  });
  
  return faq;
}
