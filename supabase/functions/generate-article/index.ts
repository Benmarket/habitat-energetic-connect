import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fonction pour mélanger un tableau (Fisher-Yates shuffle)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Sélectionner N éléments aléatoires d'un tableau
function selectRandom<T>(array: T[], count: number): T[] {
  return shuffleArray(array).slice(0, count);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SÉCURITÉ: Vérifier l'authentification via le header Authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Non autorisé - Token manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // ✅ IMPORTANT (verify_jwt=false): on valide le JWT nous-mêmes
    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Non autorisé - Token invalide', details: claimsError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Non autorisé - Utilisateur non identifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // RATE LIMITING: Max 10 appels par heure par utilisateur
    // ============================================
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Vérifier le rate limit via la fonction SQL
    const { data: canProceed, error: rateLimitError } = await supabaseAdmin
      .rpc('check_ai_rate_limit', { 
        p_user_id: userId, 
        p_endpoint: 'generate-article',
        p_max_per_hour: 10 
      });
    
    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      // En cas d'erreur, on continue mais on log
    } else if (canProceed === false) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Limite atteinte : 10 générations maximum par heure. Réessayez plus tard.' 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Enregistrer cet appel
    await supabaseAdmin.rpc('record_ai_call', { 
      p_user_id: userId, 
      p_endpoint: 'generate-article' 
    });

    const { 
      keywords, 
      contentType,
      baseContent, 
      additionalInstructions, 
      customInstructions,
      guideTemplate
    } = await req.json();
    
    if (!keywords || keywords.length === 0) {
      throw new Error('Au moins un mot-clé est requis');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Récupérer la configuration depuis site_settings
    
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

    // Récupérer les boutons et bandeaux CTA de l'utilisateur
    let buttonPresets: any[] = [];
    let ctaBanners: any[] = [];

    if (userId) {
      // Récupérer les boutons
      const buttonsResponse = await fetch(`${supabaseUrl}/rest/v1/button_presets?select=id,name,text,url,background_color,text_color,size,width,custom_width,align,border_radius,padding_x,padding_y,border_width,border_color,border_style,shadow_size,hover_effect,use_gradient,gradient_type,gradient_color1,gradient_color2,gradient_angle,hover_gradient_shift&user_id=eq.${userId}`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });
      buttonPresets = await buttonsResponse.json();

      // Récupérer les bandeaux CTA
      const bannersResponse = await fetch(`${supabaseUrl}/rest/v1/cta_banners?select=id,name,template_style,title,subtitle,background_color,secondary_color,text_color,accent_color&user_id=eq.${userId}`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });
      ctaBanners = await bannersResponse.json();
    }

    // Fonction pour créer les instructions CTA pour une variante spécifique
    function createCtaInstructions(variantIndex: number = 0): string {
      let instructions = '';
      
      // Sélectionner des boutons différents pour chaque variante
      const shuffledButtons = shuffleArray([...buttonPresets]);
      const buttonsForVariant = shuffledButtons.slice(0, Math.min(4, shuffledButtons.length));
      
      // Sélectionner des bannières différentes pour chaque variante
      const shuffledBanners = shuffleArray([...ctaBanners]);
      const bannersForVariant = shuffledBanners.slice(0, Math.min(2, shuffledBanners.length));
      
      if (buttonsForVariant.length > 0) {
        instructions += `\n\n=== BOUTONS CTA OBLIGATOIRES (VARIANTE ${variantIndex + 1}) ===
Tu DOIS utiliser AU MOINS 2-3 de ces boutons différents dans ton article :
${buttonsForVariant.map((btn: any, i: number) => 
  `BOUTON ${i + 1}: Texte="${btn.text}" | URL="${btn.url}" | Nom="${btn.name}"`
).join('\n')}

FORMAT D'INSERTION (copie exactement ce format) :
${buttonsForVariant.slice(0, 3).map((btn: any) => 
  `[BUTTON:${btn.text}|${btn.url}]`
).join('\n')}

⚠️ IMPORTANT: Utilise les boutons EXACTEMENT comme listés ci-dessus, avec leur texte et URL exacts !
⚠️ VARIE les boutons - utilise au moins 2 boutons DIFFÉRENTS !`;
      } else {
        instructions += `\n\n=== BOUTONS CTA ===
Aucun bouton personnalisé disponible. Utilise le format [BUTTON:Demander un devis|#contact] pour créer des boutons génériques.`;
      }

      if (bannersForVariant.length > 0) {
        instructions += `\n\n=== BANNIÈRES CTA OBLIGATOIRES (VARIANTE ${variantIndex + 1}) ===
Tu DOIS insérer AU MOINS 1-2 de ces bannières dans ton article :
${bannersForVariant.map((banner: any, i: number) => 
  `BANNIÈRE ${i + 1}: ID="${banner.id}" | Titre="${banner.title}" | Style="${banner.template_style}"`
).join('\n')}

FORMAT D'INSERTION (copie exactement ce format) :
${bannersForVariant.map((banner: any) => 
  `[CTA_BANNER:${banner.id}]`
).join('\n')}

⚠️ IMPORTANT: Place les bannières stratégiquement - une au milieu de l'article et une avant la conclusion !
⚠️ Copie l'ID EXACT de la bannière dans le format ci-dessus !`;
      } else {
        instructions += `\n\n=== BANNIÈRES CTA ===
Aucune bannière CTA disponible. Concentre-toi sur les boutons CTA.`;
      }
      
      return instructions;
    }
    
    // Pour usage dans le système - on utilisera des instructions spécifiques par variante
    const ctaInstructionsBase = createCtaInstructions(0);

    // Instructions spécifiques pour les guides avec thème et sections
    let themeInstructions = '';
    let guideStructureInstructions = '';
    
    if (contentType === 'guide' && guideTemplate) {
      const themeDescriptions: Record<string, string> = {
        classique: "Style classique et professionnel, sobre et élégant",
        premium: "Style premium haut de gamme avec effets visuels modernes, adapté au luxe",
        expert: "Style technique et expert, données précises, ton professionnel",
        epure: "Style épuré et minimaliste, focus sur le contenu, design aéré",
        vibrant: "Style dynamique et coloré, ton enthousiaste, engageant",
        sombre: "Style sombre et moderne, sophistiqué, effets subtils"
      };
      
      themeInstructions = `\n\nTHÈME DU GUIDE: ${guideTemplate.toUpperCase()}
${themeDescriptions[guideTemplate] || ''}
Adapte le ton, le style d'écriture et les appels à l'action à ce thème.`;

      // Instructions spécifiques pour la structure en sections des guides
      guideStructureInstructions = `

STRUCTURE EN SECTIONS POUR GUIDE:
Le guide DOIT être structuré en 4-6 sections distinctes, chaque section commençant par un <h2> avec un ID unique.
Chaque section doit avoir un titre clair et descriptif.

FORMAT OBLIGATOIRE POUR CHAQUE SECTION:
<h2 id="nom-de-la-section">Titre de la section</h2>
<p>Contenu de la section...</p>
[Listes, images, boutons, etc.]

EXEMPLE DE STRUCTURE:
<h2 id="introduction">Introduction et contexte</h2>
<p>Texte d'introduction...</p>

<h2 id="avantages">Les avantages clés</h2>
<p>Description des avantages...</p>
<ul><li>Avantage 1</li><li>Avantage 2</li></ul>

<h2 id="comment-ca-marche">Comment ça fonctionne</h2>
<p>Explication du fonctionnement...</p>

<h2 id="etapes">Les étapes à suivre</h2>
<ol><li>Étape 1</li><li>Étape 2</li></ol>

<h2 id="conseils">Conseils pratiques</h2>
<p>Recommandations...</p>

<h2 id="conclusion">Conclusion</h2>
<p>Résumé et appel à l'action...</p>

IMPORTANT: Chaque <h2> DOIT avoir un attribut id unique basé sur le slug du titre !`;
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

LONGUEUR: Minimum 1000 mots, idéalement 1200-1800 mots.
${themeInstructions}
${guideStructureInstructions}

IMPORTANT : 
- Retourne UNIQUEMENT le HTML pur sans balises markdown, sans commentaires, sans explications
- TOUS les boutons doivent être au format [BUTTON:Texte|URL]
- TOUS les bandeaux doivent être au format [CTA_BANNER:ID]
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
- Avoir 2-3 boutons CTA CENTRÉS stratégiques (VARIE les boutons !)
- Inclure 1-2 bandeaux CTA si disponibles
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
[CTA_BANNER:id-du-bandeau]
[BUTTON:En savoir plus|#info]

IMPORTANT : 
- Utilise UNIQUEMENT le format [BUTTON:Texte|URL] pour les boutons.
- Utilise le format [CTA_BANNER:ID] pour les bandeaux.
- VARIE les boutons et bandeaux utilisés !
- Retourne UNIQUEMENT le HTML sans balises de code ni commentaires.`;

    // Si on a des instructions additionnelles pour régénérer une variante
    if (additionalInstructions) {
      userPrompt += `\n\nINSTRUCTIONS ADDITIONNELLES IMPORTANTES À SUIVRE :\n${additionalInstructions}`;
      
      if (baseContent) {
        userPrompt += `\n\nCONTENU DE BASE À AMÉLIORER :\n${baseContent.substring(0, 2000)}...\n\nAMÉLIORE ce contenu en suivant les instructions ci-dessus.`;
      }
    }


    // Générer les variantes avec des CTA différents
    let variants;
    if (additionalInstructions) {
      // Régénération d'une seule variante avec instructions
      // Régénération d'une seule variante avec instructions
      const ctaForRegen = createCtaInstructions(0);
      const regeneratedContent = await generateVariant(
        apiUrl, model, OPENAI_API_KEY, finalSystemPrompt, 
        userPrompt + ctaForRegen
      );
      variants = [regeneratedContent];
    } else {
      // Génération initiale : 2 variantes avec boutons/bannières différents
      // Génération initiale : 2 variantes avec boutons/bannières différents
      const cta1 = createCtaInstructions(0);
      const cta2 = createCtaInstructions(1);
      
      variants = await Promise.all([
        generateVariant(
          apiUrl, model, OPENAI_API_KEY, finalSystemPrompt, 
          userPrompt + cta1 + "\n\nVARIANTE 1 : Ton pédagogique, accessible au grand public, beaucoup d'exemples concrets et de bénéfices chiffrés."
        ),
        generateVariant(
          apiUrl, model, OPENAI_API_KEY, finalSystemPrompt, 
          userPrompt + cta2 + "\n\nVARIANTE 2 : Ton plus technique et expert, focus sur l'expertise et la crédibilité, données précises et arguments d'autorité."
        )
      ]);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        variants: variants.map((content, index) => {
          const cleanContent = cleanHtml(content, ctaBanners, buttonPresets);
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

function cleanHtml(htmlContent: string, ctaBanners: any[], buttonPresets: any[] = []): string {
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
  cleaned = convertButtonsToCustomFormat(cleaned, buttonPresets);

  // Convertir les bandeaux CTA au format [CTA_BANNER:ID]
  cleaned = convertCtaBannersToHtml(cleaned, ctaBanners);

  // Centrer toutes les images
  cleaned = centerImages(cleaned);

  return cleaned;
}

function convertButtonsToCustomFormat(htmlContent: string, buttonPresets: any[]): string {
  const buttonRegex = /\[BUTTON:([^\|]+)\|([^\]]+)\]/g;

  const findPreset = (text: string, url: string) =>
    buttonPresets.find(
      (b: any) => (b.text || '').trim() === text.trim() && (b.url || '').trim() === url.trim(),
    );

  const toBool = (v: any, fallback: boolean) => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v === 'true';
    return fallback;
  };

  const toNum = (v: any, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  return htmlContent.replace(buttonRegex, (_match, rawText, rawUrl) => {
    const text = String(rawText ?? '').trim();
    const url = String(rawUrl ?? '').trim();

    const preset = findPreset(text, url);

    const backgroundColor = preset?.background_color ?? '#10b981';
    const textColor = preset?.text_color ?? '#ffffff';

    const size = preset?.size ?? 'medium';
    const width = preset?.width ?? 'auto';
    const customWidth = toNum(preset?.custom_width, 200);
    const align = preset?.align ?? 'center';

    const borderRadius = toNum(preset?.border_radius, 6);
    const paddingX = toNum(preset?.padding_x, 24);
    const paddingY = toNum(preset?.padding_y, 12);
    const borderWidth = toNum(preset?.border_width, 0);
    const borderColor = preset?.border_color ?? '#000000';
    const borderStyle = preset?.border_style ?? 'solid';

    const shadowSize = preset?.shadow_size ?? 'md';
    const hoverEffect = toBool(preset?.hover_effect, true);

    const useGradient = toBool(preset?.use_gradient, false);
    const gradientType = preset?.gradient_type ?? 'linear';
    const gradientColor1 = preset?.gradient_color1 ?? '#ec4899';
    const gradientColor2 = preset?.gradient_color2 ?? '#8b5cf6';
    const gradientAngle = toNum(preset?.gradient_angle, 90);
    const hoverGradientShift = toBool(preset?.hover_gradient_shift, true);

    const destinationType = url.startsWith('http')
      ? 'external'
      : url.startsWith('#')
        ? 'anchor'
        : 'internal';

    const sizeMap: Record<string, string> = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };

    const shadowMap: Record<string, string> = {
      none: 'none',
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    };

    const widthStyle = width === 'full' ? '100%' : width === 'custom' ? `${customWidth}px` : 'auto';
    const border = borderWidth > 0 ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none';

    let backgroundStyle: string;
    if (useGradient) {
      if (gradientType === 'linear') {
        backgroundStyle = `background: linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})`;
      } else {
        backgroundStyle = `background: radial-gradient(circle at center, ${gradientColor1}, ${gradientColor2})`;
      }
    } else {
      backgroundStyle = `background-color: ${backgroundColor}`;
    }

    const buttonStyle = [
      backgroundStyle,
      `color: ${textColor}`,
      `padding: ${paddingY}px ${paddingX}px`,
      `border-radius: ${borderRadius}px`,
      `font-size: ${sizeMap[size] ?? '16px'}`,
      'font-weight: 500',
      'text-decoration: none',
      'display: inline-block',
      'transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      `border: ${border}`,
      'cursor: pointer',
      `width: ${widthStyle}`,
      'text-align: center',
      `box-shadow: ${shadowMap[shadowSize] ?? shadowMap.md}`,
    ].join('; ');

    const targetAttr = destinationType === 'external' ? ' target="_blank"' : '';
    const relAttr = destinationType === 'external' ? ' rel="noopener noreferrer"' : '';

    return `<div data-custom-button class="custom-button-wrapper my-4" style="text-align: ${align}"
  data-text="${escapeHtmlAttr(text)}"
  data-url="${escapeHtmlAttr(url)}"
  data-destination-type="${destinationType}"
  data-background-color="${escapeHtmlAttr(backgroundColor)}"
  data-text-color="${escapeHtmlAttr(textColor)}"
  data-size="${size}"
  data-width="${width}"
  data-custom-width="${customWidth}"
  data-align="${align}"
  data-border-radius="${borderRadius}"
  data-padding-x="${paddingX}"
  data-padding-y="${paddingY}"
  data-border-width="${borderWidth}"
  data-border-color="${escapeHtmlAttr(borderColor)}"
  data-border-style="${borderStyle}"
  data-shadow-size="${shadowSize}"
  data-hover-effect="${hoverEffect}"
  data-use-gradient="${useGradient}"
  data-gradient-type="${gradientType}"
  data-gradient-direction="to-right"
  data-gradient-color1="${escapeHtmlAttr(gradientColor1)}"
  data-gradient-color2="${escapeHtmlAttr(gradientColor2)}"
  data-gradient-angle="${gradientAngle}"
  data-hover-gradient-shift="${hoverGradientShift}">
  <a href="${escapeHtmlAttr(url)}" style="${escapeHtmlAttr(buttonStyle)}"${targetAttr}${relAttr}
     data-button-text="${escapeHtmlAttr(text)}"
     data-button-color="${escapeHtmlAttr(backgroundColor)}"
     data-destination-type="${destinationType}">${escapeHtmlText(text)}</a>
</div>`;
  });
}

function convertCtaBannersToHtml(htmlContent: string, ctaBanners: any[]): string {
  const bannerRegex = /\[CTA_BANNER:([^\]]+)\]/g;

  return htmlContent.replace(bannerRegex, (_match, bannerId) => {
    const banner = ctaBanners.find((b) => b.id === String(bannerId).trim());

    if (!banner) {
      if (ctaBanners.length > 0) {
        const randomBanner = ctaBanners[Math.floor(Math.random() * ctaBanners.length)];
        return generateBannerHtml(randomBanner);
      }
      return '';
    }

    return generateBannerHtml(banner);
  });
}

function generateBannerHtml(banner: any): string {
  const bannerId = String(banner.id ?? '').trim();
  const templateStyle = String(banner.template_style ?? 'wave');

  const bgColor = banner.background_color || '#0284c7';
  const secondaryColor = banner.secondary_color || '#0369a1';
  const textColor = banner.text_color || '#ffffff';
  const accentColor = banner.accent_color || '#f59e0b';

  const title = String(banner.title ?? '').trim();
  const subtitle = String(banner.subtitle ?? '').trim();

  // Cohérent avec CustomCtaBanner
  const buttonText = 'Profiter de cette offre';
  const buttonUrl = '#contact';
  const buttonBg = accentColor;
  const buttonTextColor = '#000000';
  const buttonRadius = 6;

  let backgroundStyle = '';
  switch (templateStyle) {
    case 'wave':
      backgroundStyle = `background: linear-gradient(135deg, ${bgColor} 0%, ${secondaryColor} 100%);`;
      break;
    case 'geometric':
      backgroundStyle = `background: ${bgColor};`;
      break;
    case 'gradient':
      backgroundStyle = `background: linear-gradient(90deg, ${bgColor}, ${secondaryColor});`;
      break;
    case 'minimal':
    default:
      backgroundStyle = `background: ${bgColor};`;
  }

  const buttonStyle = [
    'display: inline-block',
    'margin-top: 1rem',
    'padding: 0.75rem 1.5rem',
    `background: ${buttonBg}`,
    `color: ${buttonTextColor}`,
    `border-radius: ${buttonRadius}px`,
    'text-decoration: none',
    'font-weight: 600',
  ].join('; ');

  return `<div data-cta-banner="${escapeHtmlAttr(bannerId)}"
  data-template-style="${escapeHtmlAttr(templateStyle)}"
  data-bg-color="${escapeHtmlAttr(bgColor)}"
  data-secondary-color="${escapeHtmlAttr(secondaryColor)}"
  data-text-color="${escapeHtmlAttr(textColor)}"
  data-accent-color="${escapeHtmlAttr(accentColor)}"
  data-title="${escapeHtmlAttr(title)}"
  data-subtitle="${escapeHtmlAttr(subtitle)}"
  data-button-text="${escapeHtmlAttr(buttonText)}"
  data-button-url="${escapeHtmlAttr(buttonUrl)}"
  data-button-bg="${escapeHtmlAttr(buttonBg)}"
  data-button-text-color="${escapeHtmlAttr(buttonTextColor)}"
  data-button-radius="${buttonRadius}"
  data-popup-id=""
  class="cta-banner-wrapper my-8"
  style="border-radius: 12px; overflow: hidden; ${escapeHtmlAttr(backgroundStyle)} color: ${escapeHtmlAttr(textColor)}; padding: 2rem; text-align: center;">
  <h3 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700; color: ${escapeHtmlAttr(textColor)};">${escapeHtmlText(title)}</h3>
  ${subtitle ? `<p style="margin: 0; opacity: 0.9; color: ${escapeHtmlAttr(textColor)};">${escapeHtmlText(subtitle)}</p>` : ''}
  <a href="${escapeHtmlAttr(buttonUrl)}" style="${escapeHtmlAttr(buttonStyle)}">${escapeHtmlText(buttonText)}</a>
</div>`;
}

function centerImages(htmlContent: string): string {
  // Centrer toutes les balises <img> en les enveloppant dans un div centré
  return htmlContent.replace(
    /<img([^>]*)>/g,
    '<div style="text-align: center; margin: 1.5rem 0;"><img$1 style="max-width: 100%; height: auto; border-radius: 8px;"></div>'
  );
}

function escapeHtmlAttr(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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
