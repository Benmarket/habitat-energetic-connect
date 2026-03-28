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
        JSON.stringify({ success: false, error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const { data: canProceed } = await supabaseAdmin
      .rpc('check_ai_rate_limit', { p_user_id: userId, p_endpoint: 'generate-article', p_max_per_hour: 20 });

    if (canProceed === false) {
      return new Response(
        JSON.stringify({ success: false, error: 'Limite atteinte : 20 générations maximum par heure.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabaseAdmin.rpc('record_ai_call', { p_user_id: userId, p_endpoint: 'generate-article' });

    const body = await req.json();
    const { mode } = body;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
    const model = "google/gemini-3-flash-preview";

    const todayDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    // ══════════════════════════════════════════
    // MODE: ANGLES — Propose 5 editorial angles
    // ══════════════════════════════════════════
    if (mode === 'angles') {
      const { product, theme, objective, keywords, freePrompt, contentType, customInstructions, targetRegions } = body;

      if (!product || !theme || !objective) throw new Error('Produit, thème et objectif sont obligatoires');

      const objectiveLabels: Record<string, string> = {
        lead: 'génération de leads',
        reassure: 'rassurer le prospect',
        educate: 'éduquer et informer',
        prequalify: 'pré-qualification des prospects',
        convert: 'conversion directe',
      };

      const contentTypeLabels: Record<string, string> = {
        actualite: "actualité",
        guide: "guide pratique",
        aide: "article sur les aides/subventions"
      };

      const systemPrompt = `Tu es un stratège éditorial SEO expert en ${contentTypeLabels[contentType] || 'articles'} pour le secteur des énergies renouvelables et aides gouvernementales françaises.

DATE ACTUELLE: ${todayDate}. Toutes tes propositions doivent être à jour et pertinentes pour cette date. Ne mentionne JAMAIS de dates passées (2023, 2024, 2025) sauf pour comparer avec la situation actuelle.

Tu dois proposer EXACTEMENT 5 angles éditoriaux DIFFÉRENTS et STRATÉGIQUES pour un article.

CONTEXTE:
- Produit: ${product}
- Thème: ${theme}
- Objectif: ${objectiveLabels[objective] || objective}
- Type: ${contentTypeLabels[contentType] || 'article'}
${keywords?.length > 0 ? `- Mots-clés SEO: ${keywords.join(', ')}` : ''}
${targetRegions?.length > 0 ? `- Régions cibles: ${targetRegions.join(', ')} (adapte le contenu, les aides locales et les références géographiques)` : ''}
${freePrompt ? `- Contraintes: ${freePrompt}` : ''}
${customInstructions ? `- Instructions: ${customInstructions}` : ''}

RÈGLES:
- 5 angles RADICALEMENT DIFFÉRENTS
- Chaque angle doit servir l'objectif "${objectiveLabels[objective] || objective}"
- Penser conversion et leads
${contentType === 'actualite' ? `- C'est une ACTUALITÉ (news), PAS un guide. Ne propose JAMAIS d'angle "Guide pratique". Les angles doivent être journalistiques, informatifs, viraux.
- Varier: décryptage, analyse, tendance, alerte, révélation, comparatif, question directe, témoignage, chiffres clés` : ''}
${contentType === 'guide' ? `- C'est un GUIDE PRATIQUE. Les angles doivent être pédagogiques, actionnables, exhaustifs.
- Varier: guide pas-à-pas, checklist, dossier expert, simulation, erreurs à éviter, comparatif technique` : ''}
${contentType === 'aide' ? `- C'est un article sur les AIDES/SUBVENTIONS. Les angles doivent être informatifs, concrets, orientés démarches.
- Varier: décryptage, simulation, éligibilité, comparatif aides, étude de cas, erreurs à éviter, checklist` : ''}

RETOURNE un JSON VALIDE (sans markdown ni backticks) :
[
  { "id": 1, "type": "TYPE_ANGLE", "title": "Titre proposé pour l'article", "intention": "Description courte de l'approche et pourquoi elle convertit" },
  ...
]

${contentType === 'actualite' ? 'Types possibles: Décryptage, Analyse, Tendance, Alerte, Révélation, Comparatif, Question directe, Témoignage, Chiffres clés, Dossier' : ''}
${contentType === 'guide' ? 'Types possibles: Guide pas-à-pas, Checklist, Dossier expert, Simulation concrète, Erreur à éviter, Comparatif technique, Tutoriel, FAQ complète' : ''}
${contentType === 'aide' ? 'Types possibles: Décryptage, Simulation, Éligibilité, Comparatif aides, Étude de cas, Erreur à éviter, Checklist démarches, Dossier expert' : ''}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({
          model,
          max_tokens: 1500,
          temperature: 0.9,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Propose 5 angles éditoriaux pour: ${product} — ${theme} (objectif: ${objectiveLabels[objective] || objective})` }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 429) throw new Error('Limite IA atteinte, réessayez dans quelques instants.');
        if (response.status === 402) throw new Error('Crédits IA insuffisants.');
        throw new Error(`Erreur API IA: ${response.status} - ${errText}`);
      }
      const data = await response.json();
      const raw = data.choices[0].message.content.trim().replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

      let angles;
      try { angles = JSON.parse(raw); } catch { throw new Error('Format de réponse invalide'); }

      return new Response(
        JSON.stringify({ success: true, angles }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ══════════════════════════════════════════
    // MODE: ARTICLE — Generate single article
    // ══════════════════════════════════════════
    if (mode === 'article') {
      const {
        product, theme, objective, keywords, freePrompt, targetRegions,
        contentType, customInstructions, guideTemplate,
        selectedAngle
      } = body;

      if (!selectedAngle) throw new Error('Angle sélectionné requis');

      // Fetch CTA presets
      let buttonPresets: any[] = [];
      let ctaBanners: any[] = [];
      let activePopups: any[] = [];

      if (userId) {
        const [buttonsRes, bannersRes, popupsRes] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/button_presets?select=*&user_id=eq.${userId}`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          }),
          fetch(`${supabaseUrl}/rest/v1/cta_banners?select=*&user_id=eq.${userId}`, {
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

      const popupWithForm = activePopups.find((p: any) => p.form_id);
      const defaultPopupId = popupWithForm?.id || (activePopups.length > 0 ? activePopups[0].id : '');

      // CTA instructions
      let ctaInstructions = '';
      const shuffledButtons = shuffleArray([...buttonPresets]);
      const btns = shuffledButtons.slice(0, 3);
      if (btns.length > 0) {
        ctaInstructions += `\n\nBOUTONS CTA:
${btns.map((b: any, i: number) => `${i + 1}. "${b.text}" → ${b.url}`).join('\n')}
FORMAT: [BUTTON:Texte|URL]`;
      } else {
        ctaInstructions += `\nBOUTONS CTA: [BUTTON:Demander un devis gratuit|#contact]`;
      }

      const shuffledBanners = shuffleArray([...ctaBanners]);
      const bnrs = shuffledBanners.slice(0, 2);
      if (bnrs.length > 0) {
        ctaInstructions += `\n\nBANNIÈRES CTA:
${bnrs.map((b: any) => `ID="${b.id}" Titre="${b.title}"`).join('\n')}
FORMAT: [CTA_BANNER:ID]`;
      }

      // Guide-specific
      let guideBlock = '';
      if (contentType === 'guide' && guideTemplate) {
        const themes: Record<string, string> = {
          classique: "professionnel et sobre", premium: "haut de gamme", expert: "technique et précis",
          epure: "minimaliste", vibrant: "dynamique et coloré", sombre: "moderne et sombre"
        };
        guideBlock = `\nSTYLE: ${themes[guideTemplate] || guideTemplate}\nSTRUCTURE: 5-8 sections <h2 id="slug">Titre</h2>. Guide autonome et actionnable.`;
      }

      const objectiveLabels: Record<string, string> = {
        lead: 'génération de leads', reassure: 'rassurer', educate: 'éduquer',
        prequalify: 'pré-qualifier', convert: 'convertir',
      };

      const contentTypeLabels: Record<string, string> = {
        actualite: "actualité", guide: "guide pratique détaillé", aide: "article aides/subventions"
      };

      const systemPrompt = `Tu es un rédacteur SEO expert spécialisé énergies renouvelables et aides françaises.
DATE ACTUELLE: ${todayDate}. Tout le contenu doit être à jour. Utilise les chiffres, barèmes et réglementations en vigueur en ${new Date().getFullYear()}.
Tu rédiges UN SEUL article optimisé lead/conversion.

TYPE: ${contentTypeLabels[contentType] || 'article'}
PRODUIT: ${product}
THÈME: ${theme}
OBJECTIF: ${objectiveLabels[objective] || objective}
ANGLE ÉDITORIAL: [${selectedAngle.type}] ${selectedAngle.title}
INTENTION: ${selectedAngle.intention}
${keywords?.length > 0 ? `MOTS-CLÉS: ${keywords.join(', ')}` : ''}
${targetRegions?.length > 0 ? `RÉGIONS CIBLES: ${targetRegions.join(', ')}
IMPORTANT: Adapte le contenu aux spécificités de ces régions (aides locales, climat, réglementations, exemples locaux). Mentionne les régions naturellement dans le texte pour le SEO géographique.${targetRegions.includes('corse') || targetRegions.includes('reunion') || targetRegions.includes('martinique') || targetRegions.includes('guadeloupe') || targetRegions.includes('guyane') ? ' Inclus les spécificités DOM-TOM si applicable (MaPrimeRénov Outre-mer, conditions climatiques tropicales, etc.).' : ''}` : ''}
${guideBlock}
${customInstructions ? `INSTRUCTIONS: ${customInstructions}` : ''}
${freePrompt ? `CONTRAINTES: ${freePrompt}` : ''}

═══════════════════════════════════════════
STRUCTURE OBLIGATOIRE (suivre cet ordre)
═══════════════════════════════════════════

1. <h1>Titre (basé sur l'angle choisi)</h1>

2. [IMAGE: Vue LARGE panoramique du sujet, 30+ mots descriptifs, style magazine]

3. <div class="summary-box" style="background:#f0f9ff;border-left:4px solid #0284c7;padding:1.5rem;margin:2rem 0;">
   <h2 style="margin-top:0;color:#0284c7;font-size:1.25rem;">📌 En résumé</h2>
   <ul><li>4-5 points clés</li></ul>
   </div>

4. Introduction (150-200 mots) — Accroche + problème + promesse

5. <h2>Section 1</h2> — Problème/contexte (200-300 mots, données chiffrées)

6. [BUTTON:CTA] — Premier call-to-action

7. <h2>Section 2</h2> — Développement valeur (200-300 mots)

8. [IMAGE: GROS PLAN technique ou infographie, TRÈS DIFFÉRENT de l'image 1, 30+ mots]

9. <h2>Section 3</h2> — Projection utilisateur (200+ mots)

10. [CTA_BANNER:ID] — Bannière lead capture

11. <h2>Sections supplémentaires</h2> — 1-2 H2 additionnels

12. <h2>Questions fréquentes</h2>
    <div class="faq-item"><h3>Question ?</h3><p>Réponse.</p></div> (3-5 FAQ)

13. <h2>Sources et références</h2> — Sources officielles

14. [BUTTON:CTA final]

15. Conclusion (100-150 mots) — Synthèse + passage à l'action

═══════════════════════════════════════════
RÈGLES
═══════════════════════════════════════════
• EXACTEMENT 2 [IMAGE: ...] différents (panoramique + technique)
• HTML pur (<p>, <ul>, <h2>, <h3>). Jamais de markdown.
• ${contentType === 'guide' ? '1800-2500 mots' : '1200-1800 mots'}
• Style direct, impactant, zéro blabla
• Chaque section sert l'objectif lead
• Pas de paraphrase inutile
${ctaInstructions}

Retourne UNIQUEMENT le HTML.`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({
          model, max_tokens: 8192,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Rédige l'article complet avec l'angle [${selectedAngle.type}]: "${selectedAngle.title}"` }
          ]
        })
      });

      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
      const data = await response.json();
      let content = data.choices[0].message.content;

      // Clean & convert
      content = cleanHtml(content, ctaBanners, buttonPresets, defaultPopupId);
      const faq = extractFaq(content);
      const tldr = extractTldr(content);

      const article = {
        title: extractTitle(content),
        content,
        excerpt: generateExcerpt(content),
        metaTitle: extractMetaTitle(content),
        metaDescription: extractMetaDescription(content),
        focusKeywords: keywords || [],
        tldr,
        faq,
      };

      return new Response(
        JSON.stringify({ success: true, article }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    throw new Error(`Mode inconnu: ${mode}. Utilisez "angles" ou "article".`);

  } catch (error) {
    console.error('Error in generate-article:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Une erreur est survenue' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// ═══════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════

function cleanHtml(htmlContent: string, ctaBanners: any[], buttonPresets: any[], popupId: string): string {
  let cleaned = htmlContent
    .replace(/```html\s*/gi, '').replace(/```\s*/g, '').trim()
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

  cleaned = convertButtonsToCustomFormat(cleaned, buttonPresets);
  cleaned = convertCtaBannersToHtml(cleaned, ctaBanners, popupId);
  cleaned = centerImages(cleaned);
  return cleaned;
}

function convertButtonsToCustomFormat(html: string, presets: any[]): string {
  const regex = /\[BUTTON:([^\|]+)\|([^\]]+)\]/g;
  const find = (text: string, url: string) => presets.find((b: any) => (b.text||'').trim() === text.trim() && (b.url||'').trim() === url.trim());
  const toBool = (v: any, fb: boolean) => typeof v === 'boolean' ? v : fb;
  const toNum = (v: any, fb: number) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };

  return html.replace(regex, (_m, rawText, rawUrl) => {
    const text = String(rawText).trim();
    const url = String(rawUrl).trim();
    const p = find(text, url);
    const bg = p?.background_color ?? '#10b981';
    const tc = p?.text_color ?? '#ffffff';
    const size = p?.size ?? 'medium';
    const width = p?.width ?? 'auto';
    const cw = toNum(p?.custom_width, 200);
    const align = p?.align ?? 'center';
    const br = toNum(p?.border_radius, 6);
    const px = toNum(p?.padding_x, 24);
    const py = toNum(p?.padding_y, 12);
    const bw = toNum(p?.border_width, 0);
    const bc = p?.border_color ?? '#000000';
    const bs = p?.border_style ?? 'solid';
    const ss = p?.shadow_size ?? 'md';
    const he = toBool(p?.hover_effect, true);
    const ug = toBool(p?.use_gradient, false);
    const gt = p?.gradient_type ?? 'linear';
    const g1 = p?.gradient_color1 ?? '#ec4899';
    const g2 = p?.gradient_color2 ?? '#8b5cf6';
    const ga = toNum(p?.gradient_angle, 90);
    const hgs = toBool(p?.hover_gradient_shift, true);
    const dt = url.startsWith('http') ? 'external' : url.startsWith('#') ? 'anchor' : 'internal';
    const sizeMap: Record<string,string> = { small:'14px', medium:'16px', large:'18px' };
    const shadowMap: Record<string,string> = { none:'none', sm:'0 1px 2px 0 rgba(0,0,0,0.05)', md:'0 4px 6px -1px rgba(0,0,0,0.1)', lg:'0 10px 15px -3px rgba(0,0,0,0.1)' };
    const ws = width === 'full' ? '100%' : width === 'custom' ? `${cw}px` : 'auto';
    const border = bw > 0 ? `${bw}px ${bs} ${bc}` : 'none';
    const bgStyle = ug ? (gt === 'linear' ? `background:linear-gradient(${ga}deg,${g1},${g2})` : `background:radial-gradient(circle,${g1},${g2})`) : `background-color:${bg}`;
    const style = [bgStyle,`color:${tc}`,`padding:${py}px ${px}px`,`border-radius:${br}px`,`font-size:${sizeMap[size]||'16px'}`,`font-weight:500`,`text-decoration:none`,`display:inline-block`,`transition:all 0.3s`,`border:${border}`,`cursor:pointer`,`width:${ws}`,`text-align:center`,`box-shadow:${shadowMap[ss]||shadowMap.md}`].join(';');
    const ta = dt === 'external' ? ' target="_blank"' : '';
    const ra = dt === 'external' ? ' rel="noopener noreferrer"' : '';
    return `<div data-custom-button class="custom-button-wrapper my-4" style="text-align:${align}" data-text="${esc(text)}" data-url="${esc(url)}" data-destination-type="${dt}" data-background-color="${esc(bg)}" data-text-color="${esc(tc)}" data-size="${size}" data-width="${width}" data-custom-width="${cw}" data-align="${align}" data-border-radius="${br}" data-padding-x="${px}" data-padding-y="${py}" data-border-width="${bw}" data-border-color="${esc(bc)}" data-border-style="${bs}" data-shadow-size="${ss}" data-hover-effect="${he}" data-use-gradient="${ug}" data-gradient-type="${gt}" data-gradient-direction="to-right" data-gradient-color1="${esc(g1)}" data-gradient-color2="${esc(g2)}" data-gradient-angle="${ga}" data-hover-gradient-shift="${hgs}"><a href="${esc(url)}" style="${esc(style)}"${ta}${ra} data-button-text="${esc(text)}" data-button-color="${esc(bg)}" data-destination-type="${dt}">${escText(text)}</a></div>`;
  });
}

function convertCtaBannersToHtml(html: string, banners: any[], popupId: string): string {
  return html.replace(/\[CTA_BANNER:([^\]]+)\]/g, (_m, bid) => {
    const banner = banners.find((b) => b.id === String(bid).trim());
    const b = banner || (banners.length > 0 ? banners[Math.floor(Math.random() * banners.length)] : null);
    if (!b) return '';
    return generateBannerHtml(b, popupId);
  });
}

function generateBannerHtml(b: any, popupId: string): string {
  const bg = b.background_color || '#0284c7';
  const sc = b.secondary_color || '#0369a1';
  const tc = b.text_color || '#ffffff';
  const ac = b.accent_color || '#f59e0b';
  const ts = b.template_style || 'wave';
  const title = String(b.title || '');
  const subtitle = String(b.subtitle || '');
  const btnUrl = popupId ? '#' : '#contact';
  const bgStyle = ts === 'wave' ? `background:linear-gradient(135deg,${bg},${sc})` : ts === 'gradient' ? `background:linear-gradient(90deg,${bg},${sc})` : `background:${bg}`;
  const btnStyle = `display:inline-block;margin-top:1rem;padding:0.75rem 1.5rem;background:${ac};color:#000;border-radius:6px;text-decoration:none;font-weight:600`;
  return `<div data-cta-banner="${esc(b.id)}" data-template-style="${esc(ts)}" data-bg-color="${esc(bg)}" data-secondary-color="${esc(sc)}" data-text-color="${esc(tc)}" data-accent-color="${esc(ac)}" data-title="${esc(title)}" data-subtitle="${esc(subtitle)}" data-button-text="Profiter de cette offre" data-button-url="${esc(btnUrl)}" data-button-bg="${esc(ac)}" data-button-text-color="#000000" data-button-radius="6" data-popup-id="${esc(popupId)}" class="cta-banner-wrapper my-8" style="border-radius:12px;overflow:hidden;${esc(bgStyle)};color:${esc(tc)};padding:2rem;text-align:center;"><h3 style="margin:0 0 0.5rem;font-size:1.5rem;font-weight:700;color:${esc(tc)}">${escText(title)}</h3>${subtitle ? `<p style="margin:0;opacity:0.9;color:${esc(tc)}">${escText(subtitle)}</p>` : ''}<a href="${esc(btnUrl)}" style="${esc(btnStyle)}"${popupId ? ` data-popup-trigger="${esc(popupId)}"` : ''}>Profiter de cette offre</a></div>`;
}

function centerImages(html: string): string {
  return html.replace(/<img([^>]*)>/g, '<div style="text-align:center;margin:1.5rem 0"><img$1 style="max-width:100%;height:auto;border-radius:8px"></div>');
}

function esc(v: string): string {
  return String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escText(v: string): string {
  return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function extractTitle(html: string): string {
  const m = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  return m ? m[1].replace(/<[^>]*>/g,'').trim() : html.split('\n')[0].replace(/<[^>]*>/g,'').trim().slice(0,100);
}
function extractMetaTitle(html: string): string {
  const t = extractTitle(html);
  return t.length <= 60 ? t : t.slice(0,57) + '...';
}
function extractMetaDescription(html: string): string {
  const t = html.replace(/<h1[^>]*>.*?<\/h1>/gi,'').replace(/\[IMAGE:.*?\]/g,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  return t.length <= 160 ? t : t.slice(0,157) + '...';
}
function generateExcerpt(html: string): string {
  const t = html.replace(/<h1[^>]*>.*?<\/h1>/gi,'').replace(/\[IMAGE:.*?\]/g,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  return t.slice(0,300) + (t.length > 300 ? '...' : '');
}
function extractTldr(html: string): string {
  const m = html.match(/<div class="summary-box"[^>]*>(.*?)<\/div>/is);
  if (!m) return '';
  const items = m[1].match(/<li[^>]*>(.*?)<\/li>/gis);
  return items ? items.map(i => i.replace(/<[^>]*>/g,'').trim()).join('\n') : '';
}
function extractFaq(html: string): Array<{question:string;answer:string}> {
  const faq: Array<{question:string;answer:string}> = [];
  const m = html.match(/<h2[^>]*>Questions fréquentes<\/h2>(.*?)(?=<h2|$)/is);
  if (!m) return faq;
  const items = m[1].match(/<div class="faq-item"[^>]*>(.*?)<\/div>/gis);
  if (!items) return faq;
  items.forEach(item => {
    const q = item.match(/<h3[^>]*>(.*?)<\/h3>/is);
    const a = item.match(/<p[^>]*>(.*?)<\/p>/is);
    if (q && a) faq.push({ question: q[1].replace(/<[^>]*>/g,'').trim(), answer: a[1].replace(/<[^>]*>/g,'').trim() });
  });
  return faq;
}
