import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: 'Non autorisé - Token invalide' }),
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

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    
    const { data: canProceed } = await supabaseAdmin
      .rpc('check_ai_rate_limit', { 
        p_user_id: userId, 
        p_endpoint: 'generate-article',
        p_max_per_hour: 10 
      });
    
    if (canProceed === false) {
      return new Response(
        JSON.stringify({ success: false, error: 'Limite atteinte : 10 générations maximum par heure.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    await supabaseAdmin.rpc('record_ai_call', { p_user_id: userId, p_endpoint: 'generate-article' });

    const { 
      keywords, contentType, baseContent, additionalInstructions, 
      customInstructions, guideTemplate
    } = await req.json();
    
    if (!keywords || keywords.length === 0) {
      throw new Error('Au moins un mot-clé est requis');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');

    // Fetch settings
    const settingsResponse = await fetch(`${supabaseUrl}/rest/v1/site_settings?select=*&key=in.(ai_generation_api_url,ai_generation_model,ai_generation_enabled)`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    const settings = await settingsResponse.json();
    const apiUrl = settings.find((s: any) => s.key === 'ai_generation_api_url')?.value || "https://api.openai.com/v1/chat/completions";
    const model = settings.find((s: any) => s.key === 'ai_generation_model')?.value || "gpt-4o-mini";
    const enabled = settings.find((s: any) => s.key === 'ai_generation_enabled')?.value ?? true;
    if (!enabled) throw new Error('La génération d\'articles par IA est désactivée');

    // Fetch user's button presets, CTA banners, and active popups
    let buttonPresets: any[] = [];
    let ctaBanners: any[] = [];
    let activePopups: any[] = [];

    if (userId) {
      const [buttonsRes, bannersRes, popupsRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/button_presets?select=id,name,text,url,background_color,text_color,size,width,custom_width,align,border_radius,padding_x,padding_y,border_width,border_color,border_style,shadow_size,hover_effect,use_gradient,gradient_type,gradient_color1,gradient_color2,gradient_angle,hover_gradient_shift&user_id=eq.${userId}`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        }),
        fetch(`${supabaseUrl}/rest/v1/cta_banners?select=id,name,template_style,title,subtitle,background_color,secondary_color,text_color,accent_color&user_id=eq.${userId}`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        }),
        fetch(`${supabaseUrl}/rest/v1/popups?select=id,name,trigger_id,template,title,form_id&is_active=eq.true&order=created_at.desc&limit=5`, {
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
        })
      ]);
      
      buttonPresets = await buttonsRes.json();
      ctaBanners = await bannersRes.json();
      const popupsData = await popupsRes.json();
      activePopups = Array.isArray(popupsData) ? popupsData : [];
    }

    // Find popup ID to use for CTA banners
    const defaultPopupId = activePopups.length > 0 ? activePopups[0].id : '';

    function createCtaInstructions(variantIndex: number): string {
      let instructions = '';
      
      const shuffledButtons = shuffleArray([...buttonPresets]);
      const buttonsForVariant = shuffledButtons.slice(0, Math.min(4, shuffledButtons.length));
      const shuffledBanners = shuffleArray([...ctaBanners]);
      const bannersForVariant = shuffledBanners.slice(0, Math.min(2, shuffledBanners.length));
      
      if (buttonsForVariant.length > 0) {
        instructions += `\n\n=== BOUTONS CTA OBLIGATOIRES (VARIANTE ${variantIndex + 1}) ===
Tu DOIS utiliser AU MOINS 2-3 de ces boutons différents :
${buttonsForVariant.map((btn: any, i: number) => `BOUTON ${i + 1}: Texte="${btn.text}" | URL="${btn.url}" | Nom="${btn.name}"`).join('\n')}

FORMAT: [BUTTON:${buttonsForVariant[0]?.text}|${buttonsForVariant[0]?.url}]
⚠️ Utilise les boutons EXACTEMENT comme listés, avec texte et URL exacts ! Varie les boutons !`;
      } else {
        instructions += `\n\n=== BOUTONS CTA ===
Utilise le format [BUTTON:Demander un devis|#contact] pour créer des boutons.`;
      }

      if (bannersForVariant.length > 0) {
        instructions += `\n\n=== BANNIÈRES CTA OBLIGATOIRES (VARIANTE ${variantIndex + 1}) ===
Tu DOIS insérer AU MOINS 1-2 bannières :
${bannersForVariant.map((b: any, i: number) => `BANNIÈRE ${i + 1}: ID="${b.id}" | Titre="${b.title}"`).join('\n')}

FORMAT: [CTA_BANNER:${bannersForVariant[0]?.id}]
⚠️ Place les bannières stratégiquement - une au milieu et une avant la conclusion !`;
      }
      
      return instructions;
    }

    // Guide-specific instructions
    let themeInstructions = '';
    let guideStructureInstructions = '';
    
    if (contentType === 'guide' && guideTemplate) {
      const themeDescriptions: Record<string, string> = {
        classique: "Style classique et professionnel, sobre et élégant",
        premium: "Style premium haut de gamme avec effets visuels modernes",
        expert: "Style technique et expert, données précises, ton professionnel",
        epure: "Style épuré et minimaliste, focus sur le contenu",
        vibrant: "Style dynamique et coloré, ton enthousiaste, engageant",
        sombre: "Style sombre et moderne, sophistiqué, effets subtils"
      };
      
      themeInstructions = `\n\nTHÈME DU GUIDE: ${guideTemplate.toUpperCase()}
${themeDescriptions[guideTemplate] || ''}
Adapte le ton, le style d'écriture et les appels à l'action à ce thème.`;

      guideStructureInstructions = `

STRUCTURE EN SECTIONS POUR GUIDE:
Le guide DOIT être structuré en 5-8 sections distinctes, chaque section commençant par un <h2> avec un ID unique.

FORMAT OBLIGATOIRE:
<h2 id="nom-section">Titre de la section</h2>
<p>Contenu...</p>

Les guides doivent être pratiques, concrets, avec des étapes claires et des conseils actionnables.
Chaque <h2> DOIT avoir un attribut id unique basé sur le slug du titre !
Le guide doit être autonome : un lecteur doit pouvoir agir concrètement après l'avoir lu.`;
    }

    const contentTypeLabels: Record<string, string> = {
      actualite: "actualité",
      guide: "guide pratique détaillé",
      aide: "article sur les aides et subventions"
    };

    const systemPrompt = `Tu es un rédacteur SEO expert spécialisé dans les énergies renouvelables et les aides gouvernementales françaises.
Tu crées du contenu viral, complet et optimisé pour le SEO, le GEO et les recherches IA.

TYPE DE CONTENU: ${contentTypeLabels[contentType] || 'article'}

${contentType === 'guide' ? `C'est un GUIDE PRATIQUE. Il doit être :
- Exhaustif et actionnable (le lecteur peut agir concrètement après lecture)
- Structuré en sections claires avec des étapes numérotées
- Inclure des tableaux comparatifs, checklists, et exemples concrets
- Minimum 1800-2500 mots pour un guide complet` : ''}

${contentType === 'aide' ? `C'est un article sur les AIDES ET SUBVENTIONS. Il doit :
- Détailler les montants exacts, conditions d'éligibilité, plafonds de revenus
- Citer les textes officiels et dates d'application
- Inclure des exemples chiffrés de cas concrets
- Expliquer les démarches étape par étape` : ''}

STRUCTURE OBLIGATOIRE DE L'ARTICLE (dans cet ordre exact) :
1. <h1> Titre accrocheur optimisé SEO (60-70 caractères max)
2. [IMAGE: description détaillée de l'image héro principale]
3. Bloc "EN RÉSUMÉ" (TL;DR) - 3-4 points clés
4. Introduction captivante (150-200 mots)
5. Section H2 #1 avec contenu détaillé
6. [BUTTON:CTA] stratégiquement placé
7. Section H2 #2 avec contenu détaillé + listes/tableaux
8. [IMAGE: description détaillée d'une 2e image complémentaire]
9. Section H2 #3 avec contenu
10. [CTA_BANNER:ID] si disponible
11. Sections H2 supplémentaires (2-3 de plus)
12. Section FAQ "Questions fréquentes" avec 3-5 Q&A
13. Sources et références
14. [BUTTON:CTA final] avant conclusion
15. Conclusion avec appel à l'action

FORMAT DU BLOC RÉSUMÉ:
<div class="summary-box" style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 1.5rem; margin: 2rem 0;">
  <h2 style="margin-top: 0; color: #0284c7; font-size: 1.25rem;">📌 En résumé</h2>
  <ul>
    <li><strong>Point clé 1</strong>: Description</li>
    <li><strong>Point clé 2</strong>: Description</li>
    <li><strong>Point clé 3</strong>: Description</li>
  </ul>
</div>

FORMAT FAQ:
<h2>Questions fréquentes</h2>
<div class="faq-item"><h3>Question ?</h3><p>Réponse détaillée.</p></div>

FORMAT SOURCES:
<h2>Sources et références</h2>
<ul class="sources-list"><li><strong>ADEME</strong> - Titre, 2024</li></ul>

IMAGES:
- Tu DOIS inclure EXACTEMENT 2 images complémentaires
- Image 1 : héro principale après le H1 (vue d'ensemble, illustration du sujet)
- Image 2 : complémentaire au milieu de l'article (détail, schéma, exemple concret)
- Format: [IMAGE: Description TRÈS détaillée en français]
- Les 2 images doivent être DIFFÉRENTES et complémentaires

OPTIMISATION SEO & GEO:
- Mots-clés naturels (densité 1-2%)
- Questions que les gens posent vraiment
- Sources officielles (ADEME, Ministères, INSEE)
- Données chiffrées précises avec années
- Ton conversationnel et accessible
- Structure en pyramide inversée

FORMATAGE HTML:
- Uniquement du HTML pur et valide (pas de markdown)
- Paragraphes dans <p>, listes dans <ul>/<ol>, titres en <h2>/<h3>
- Au moins 2-3 listes à puces pour la lisibilité
${themeInstructions}
${guideStructureInstructions}

LONGUEUR: ${contentType === 'guide' ? 'Minimum 1800 mots, idéalement 2000-2500 mots' : 'Minimum 1200 mots, idéalement 1500-1800 mots'}.

IMPORTANT: Retourne UNIQUEMENT le HTML pur. Pas de markdown, pas de commentaires, pas d'explications.`;

    let finalSystemPrompt = systemPrompt;
    if (customInstructions?.trim()) {
      finalSystemPrompt += `\n\nINSTRUCTIONS PERSONNALISÉES :\n${customInstructions}`;
    }

    const keywordsText = keywords.join(', ');
    
    let userPrompt = `Crée un ${contentTypeLabels[contentType] || 'article'} COMPLET et professionnel sur : ${keywordsText}.

MOTS-CLÉS: ${keywordsText}

RAPPEL DE LA STRUCTURE (suis cet ordre) :
1. H1 titre
2. [IMAGE: héro du sujet - description détaillée]
3. Bloc résumé TL;DR
4. Introduction
5. Sections H2 avec contenu riche
6. [BUTTON:CTA] après la 1ère section importante
7. [IMAGE: 2e image complémentaire - description détaillée DIFFÉRENTE de la 1ère]
8. Plus de sections
9. [CTA_BANNER:ID] au 2/3 de l'article
10. FAQ (3-5 questions)
11. Sources
12. [BUTTON:CTA final]
13. Conclusion

⚠️ Les 2 images DOIVENT être différentes et complémentaires !
⚠️ Retourne UNIQUEMENT le HTML sans balises de code.`;

    if (additionalInstructions) {
      userPrompt += `\n\nINSTRUCTIONS ADDITIONNELLES:\n${additionalInstructions}`;
      if (baseContent) {
        userPrompt += `\n\nCONTENU DE BASE À AMÉLIORER:\n${baseContent.substring(0, 2000)}...`;
      }
    }

    let variants;
    if (additionalInstructions) {
      const ctaForRegen = createCtaInstructions(0);
      const regeneratedContent = await generateVariant(apiUrl, model, OPENAI_API_KEY, finalSystemPrompt, userPrompt + ctaForRegen);
      variants = [regeneratedContent];
    } else {
      const cta1 = createCtaInstructions(0);
      const cta2 = createCtaInstructions(1);
      
      variants = await Promise.all([
        generateVariant(apiUrl, model, OPENAI_API_KEY, finalSystemPrompt, 
          userPrompt + cta1 + "\n\nVARIANTE 1 : Ton pédagogique, accessible au grand public, exemples concrets et bénéfices chiffrés."
        ),
        generateVariant(apiUrl, model, OPENAI_API_KEY, finalSystemPrompt, 
          userPrompt + cta2 + "\n\nVARIANTE 2 : Ton plus technique et expert, focus expertise et crédibilité, données précises."
        )
      ]);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        variants: variants.map((content, index) => {
          const cleanContent = cleanHtml(content, ctaBanners, buttonPresets, defaultPopupId);
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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in generate-article:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Une erreur est survenue' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function generateVariant(apiUrl: string, model: string, apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
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

function cleanHtml(htmlContent: string, ctaBanners: any[], buttonPresets: any[], popupId: string): string {
  let cleaned = htmlContent
    .replace(/```html\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  cleaned = convertButtonsToCustomFormat(cleaned, buttonPresets);
  cleaned = convertCtaBannersToHtml(cleaned, ctaBanners, popupId);
  cleaned = centerImages(cleaned);

  return cleaned;
}

function convertButtonsToCustomFormat(htmlContent: string, buttonPresets: any[]): string {
  const buttonRegex = /\[BUTTON:([^\|]+)\|([^\]]+)\]/g;

  const findPreset = (text: string, url: string) =>
    buttonPresets.find((b: any) => (b.text || '').trim() === text.trim() && (b.url || '').trim() === url.trim());

  const toBool = (v: any, fallback: boolean) => typeof v === 'boolean' ? v : typeof v === 'string' ? v === 'true' : fallback;
  const toNum = (v: any, fallback: number) => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };

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

    const destinationType = url.startsWith('http') ? 'external' : url.startsWith('#') ? 'anchor' : 'internal';

    const sizeMap: Record<string, string> = { small: '14px', medium: '16px', large: '18px' };
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
      backgroundStyle = gradientType === 'linear'
        ? `background: linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})`
        : `background: radial-gradient(circle at center, ${gradientColor1}, ${gradientColor2})`;
    } else {
      backgroundStyle = `background-color: ${backgroundColor}`;
    }

    const buttonStyle = [
      backgroundStyle, `color: ${textColor}`, `padding: ${paddingY}px ${paddingX}px`,
      `border-radius: ${borderRadius}px`, `font-size: ${sizeMap[size] ?? '16px'}`, 'font-weight: 500',
      'text-decoration: none', 'display: inline-block', 'transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      `border: ${border}`, 'cursor: pointer', `width: ${widthStyle}`, 'text-align: center',
      `box-shadow: ${shadowMap[shadowSize] ?? shadowMap.md}`,
    ].join('; ');

    const targetAttr = destinationType === 'external' ? ' target="_blank"' : '';
    const relAttr = destinationType === 'external' ? ' rel="noopener noreferrer"' : '';

    return `<div data-custom-button class="custom-button-wrapper my-4" style="text-align: ${align}"
  data-text="${esc(text)}" data-url="${esc(url)}" data-destination-type="${destinationType}"
  data-background-color="${esc(backgroundColor)}" data-text-color="${esc(textColor)}"
  data-size="${size}" data-width="${width}" data-custom-width="${customWidth}" data-align="${align}"
  data-border-radius="${borderRadius}" data-padding-x="${paddingX}" data-padding-y="${paddingY}"
  data-border-width="${borderWidth}" data-border-color="${esc(borderColor)}" data-border-style="${borderStyle}"
  data-shadow-size="${shadowSize}" data-hover-effect="${hoverEffect}"
  data-use-gradient="${useGradient}" data-gradient-type="${gradientType}" data-gradient-direction="to-right"
  data-gradient-color1="${esc(gradientColor1)}" data-gradient-color2="${esc(gradientColor2)}"
  data-gradient-angle="${gradientAngle}" data-hover-gradient-shift="${hoverGradientShift}">
  <a href="${esc(url)}" style="${esc(buttonStyle)}"${targetAttr}${relAttr}
     data-button-text="${esc(text)}" data-button-color="${esc(backgroundColor)}"
     data-destination-type="${destinationType}">${escText(text)}</a>
</div>`;
  });
}

function convertCtaBannersToHtml(htmlContent: string, ctaBanners: any[], popupId: string): string {
  const bannerRegex = /\[CTA_BANNER:([^\]]+)\]/g;

  return htmlContent.replace(bannerRegex, (_match, bannerId) => {
    const banner = ctaBanners.find((b) => b.id === String(bannerId).trim());
    if (!banner) {
      if (ctaBanners.length > 0) {
        return generateBannerHtml(ctaBanners[Math.floor(Math.random() * ctaBanners.length)], popupId);
      }
      return '';
    }
    return generateBannerHtml(banner, popupId);
  });
}

function generateBannerHtml(banner: any, popupId: string): string {
  const bannerId = String(banner.id ?? '').trim();
  const templateStyle = String(banner.template_style ?? 'wave');
  const bgColor = banner.background_color || '#0284c7';
  const secondaryColor = banner.secondary_color || '#0369a1';
  const textColor = banner.text_color || '#ffffff';
  const accentColor = banner.accent_color || '#f59e0b';
  const title = String(banner.title ?? '').trim();
  const subtitle = String(banner.subtitle ?? '').trim();

  const buttonText = 'Profiter de cette offre';
  const buttonUrl = popupId ? '#' : '#contact';
  const buttonBg = accentColor;
  const buttonTextColor = '#000000';
  const buttonRadius = 6;

  let backgroundStyle = '';
  switch (templateStyle) {
    case 'wave': backgroundStyle = `background: linear-gradient(135deg, ${bgColor} 0%, ${secondaryColor} 100%);`; break;
    case 'gradient': backgroundStyle = `background: linear-gradient(90deg, ${bgColor}, ${secondaryColor});`; break;
    default: backgroundStyle = `background: ${bgColor};`;
  }

  const buttonStyle = [
    'display: inline-block', 'margin-top: 1rem', 'padding: 0.75rem 1.5rem',
    `background: ${buttonBg}`, `color: ${buttonTextColor}`, `border-radius: ${buttonRadius}px`,
    'text-decoration: none', 'font-weight: 600',
  ].join('; ');

  return `<div data-cta-banner="${esc(bannerId)}"
  data-template-style="${esc(templateStyle)}"
  data-bg-color="${esc(bgColor)}" data-secondary-color="${esc(secondaryColor)}"
  data-text-color="${esc(textColor)}" data-accent-color="${esc(accentColor)}"
  data-title="${esc(title)}" data-subtitle="${esc(subtitle)}"
  data-button-text="${esc(buttonText)}" data-button-url="${esc(buttonUrl)}"
  data-button-bg="${esc(buttonBg)}" data-button-text-color="${esc(buttonTextColor)}"
  data-button-radius="${buttonRadius}"
  data-popup-id="${esc(popupId)}"
  class="cta-banner-wrapper my-8"
  style="border-radius: 12px; overflow: hidden; ${esc(backgroundStyle)} color: ${esc(textColor)}; padding: 2rem; text-align: center;">
  <h3 style="margin: 0 0 0.5rem 0; font-size: 1.5rem; font-weight: 700; color: ${esc(textColor)};">${escText(title)}</h3>
  ${subtitle ? `<p style="margin: 0; opacity: 0.9; color: ${esc(textColor)};">${escText(subtitle)}</p>` : ''}
  <a href="${esc(buttonUrl)}" style="${esc(buttonStyle)}"${popupId ? ` data-popup-trigger="${esc(popupId)}"` : ''}>${escText(buttonText)}</a>
</div>`;
}

function centerImages(htmlContent: string): string {
  return htmlContent.replace(
    /<img([^>]*)>/g,
    '<div style="text-align: center; margin: 1.5rem 0;"><img$1 style="max-width: 100%; height: auto; border-radius: 8px;"></div>'
  );
}

function esc(value: string): string {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escText(value: string): string {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function extractTitle(htmlContent: string): string {
  const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) return h1Match[1].replace(/<[^>]*>/g, '').trim();
  return htmlContent.split('\n')[0].replace(/<[^>]*>/g, '').trim().slice(0, 100);
}

function extractMetaTitle(htmlContent: string, keywords: string[]): string {
  const title = extractTitle(htmlContent);
  if (title.length <= 60) return title;
  return title.slice(0, 57) + '...';
}

function extractMetaDescription(htmlContent: string): string {
  const textOnly = htmlContent
    .replace(/<h1[^>]*>.*?<\/h1>/gi, '')
    .replace(/\[IMAGE:.*?\]/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  return textOnly.slice(0, 300) + (textOnly.length > 300 ? '...' : '');
}

function extractFirstImageDescription(htmlContent: string): string {
  const imageMatch = htmlContent.match(/\[IMAGE:\s*([^\]]+)\]/i);
  return imageMatch ? imageMatch[1].trim() : 'Image représentant le sujet de l\'article';
}

function extractTldr(htmlContent: string): string {
  const summaryBoxMatch = htmlContent.match(/<div class="summary-box"[^>]*>(.*?)<\/div>/is);
  if (!summaryBoxMatch) return '';
  const listItems = summaryBoxMatch[1].match(/<li[^>]*>(.*?)<\/li>/gis);
  if (!listItems) return '';
  return listItems.map(item => item.replace(/<[^>]*>/g, '').trim()).join('\n').trim();
}

function extractFaq(htmlContent: string): Array<{ question: string; answer: string }> {
  const faq: Array<{ question: string; answer: string }> = [];
  const faqSectionMatch = htmlContent.match(/<h2[^>]*>Questions fréquentes<\/h2>(.*?)(?=<h2|$)/is);
  if (!faqSectionMatch) return faq;
  
  const faqItems = faqSectionMatch[1].match(/<div class="faq-item"[^>]*>(.*?)<\/div>/gis);
  if (!faqItems) return faq;
  
  faqItems.forEach(item => {
    const q = item.match(/<h3[^>]*>(.*?)<\/h3>/is);
    const a = item.match(/<p[^>]*>(.*?)<\/p>/is);
    if (q && a) {
      faq.push({
        question: q[1].replace(/<[^>]*>/g, '').trim(),
        answer: a[1].replace(/<[^>]*>/g, '').trim()
      });
    }
  });
  return faq;
}
