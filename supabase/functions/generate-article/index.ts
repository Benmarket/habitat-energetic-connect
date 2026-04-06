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
      const { product, subject, theme, objective, keywords, freePrompt, contentType, customInstructions, targetRegions } = body;

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

      const systemPrompt = `Tu es un stratège éditorial SEO/GEO expert en ${contentTypeLabels[contentType] || 'articles'} pour le secteur des énergies renouvelables et aides gouvernementales françaises.

DATE ACTUELLE: ${todayDate}. Toutes tes propositions doivent être à jour et pertinentes pour cette date.

Tu dois proposer EXACTEMENT 5 angles éditoriaux DIFFÉRENTS et STRATÉGIQUES.

MÉTHODOLOGIE — PENSER COMME L'INTERNAUTE :
Avant de proposer tes angles, demande-toi :
- "Comment un propriétaire/particulier formulerait sa recherche sur Google ou demanderait à ChatGPT/Gemini ?"
- "Quelle est sa VRAIE inquiétude, son vrai blocage ?"
- "Qu'est-ce qui le ferait cliquer ET rester sur l'article ?"
- "Quelles infos il ne trouve PAS facilement sur les 10 premiers résultats Google ?"

Chaque angle doit répondre à un VRAI BESOIN humain, pas juste placer des mots-clés.

CONTEXTE:
- Produit à mettre en avant: ${product}
${subject ? `- Sujet / Trame de l'article: ${subject}` : ''}
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
- Au moins 1 angle doit aborder un aspect NÉGATIF ou HONNÊTE (limites, pièges, ce qu'on ne vous dit pas)
- Au moins 1 angle doit contenir des CHIFFRES CONCRETS dans le titre
- Les titres doivent ressembler à ce qu'un internaute CHERCHE VRAIMENT (pas du jargon marketing)
- Penser conversion ET crédibilité
${contentType === 'actualite' ? `- C'est une ACTUALITÉ (news), PAS un guide. Les angles doivent être journalistiques, informatifs, viraux.
- Varier: décryptage, analyse, tendance, alerte, révélation, comparatif, question directe, témoignage, chiffres clés` : ''}
${contentType === 'guide' ? `- C'est un GUIDE PRATIQUE. Les angles doivent être pédagogiques, actionnables, exhaustifs.
- Varier: guide pas-à-pas, checklist, dossier expert, simulation, erreurs à éviter, comparatif technique` : ''}
${contentType === 'aide' ? `- C'est un article sur les AIDES/SUBVENTIONS. Les angles doivent être informatifs, concrets, orientés démarches.
- Varier: décryptage, simulation, éligibilité, comparatif aides, étude de cas, erreurs à éviter, checklist` : ''}

RETOURNE un JSON VALIDE (sans markdown ni backticks) :
[
  { "id": 1, "type": "TYPE_ANGLE", "title": "Titre proposé pour l'article", "intention": "Description courte de l'approche, la problématique réelle adressée, et pourquoi ça convertit" },
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
            { role: 'user', content: `Propose 5 angles éditoriaux pour le produit "${product}"${subject ? ` sur le sujet "${subject}"` : ''} — thème: ${theme} (objectif: ${objectiveLabels[objective] || objective})` }
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
        product, subject, theme, objective, keywords, freePrompt, targetRegions,
        contentType, customInstructions, guideTemplate,
        selectedAngle, availableCategories, availableTags
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
        ctaInstructions += `\n\nBOUTONS CTA (VARIER LES COULEURS ! Ne pas tous utiliser la même couleur):
${btns.map((b: any, i: number) => `${i + 1}. "${b.text}" → ${b.url} (couleur: ${b.background_color || '#10b981'})`).join('\n')}
FORMAT: [BUTTON:Texte|URL]
IMPORTANT: Si les boutons ont tous la même couleur, change le texte d'au moins un pour proposer un message différent.`;
      } else {
        ctaInstructions += `\nBOUTONS CTA: [BUTTON:Demander un devis gratuit|#contact]`;
      }

      const shuffledBanners = shuffleArray([...ctaBanners]);
      const bnrs = shuffledBanners.slice(0, 2);
      if (bnrs.length > 0) {
        ctaInstructions += `\n\n═══════════════════════════════════════
BANNIÈRES CTA — PERSONNALISATION CONTEXTUELLE OBLIGATOIRE
═══════════════════════════════════════
Tu as ${bnrs.length} template(s) de bannière CTA à ta disposition (utilisés comme BASE visuelle uniquement).
${bnrs.map((b: any) => `ID="${b.id}" (template visuel: style=${b.template_style || 'wave'})`).join('\n')}

⚠️ RÈGLE CRITIQUE : Tu ne DOIS PAS utiliser le titre/sous-titre par défaut du template.
Tu DOIS personnaliser CHAQUE bannière en fonction du CONTEXTE PRÉCIS de la section où elle est placée.

FORMAT: [CTA_BANNER:ID|Titre personnalisé|Sous-titre personnalisé|Texte du bouton|COULEUR_INTENTION]

COULEUR_INTENTION (choisis selon le ton du message) :
- "urgent" → rouge/orange vif (offre limitée, deadline, alerte prix)
- "opportunity" → vert/émeraude (économie, gain, bon plan)
- "trust" → bleu/indigo (expertise, accompagnement, conseil)
- "premium" → violet/doré (exclusif, VIP, premium)
- "eco" → vert nature (écologie, impact environnemental)

RÈGLES DE PERSONNALISATION :
1. Le TITRE doit être une accroche CONCRÈTE liée au sujet de l'article et de la section (ex: "Votre toiture peut produire jusqu'à 4 500€/an d'électricité" au lieu de "Offre limitée !")
2. Le SOUS-TITRE doit apporter une PREUVE ou un BÉNÉFICE chiffré (ex: "Simulation gratuite en 2 min · Sans engagement · Résultat immédiat")
3. Le TEXTE DU BOUTON doit être une ACTION CLAIRE et CONTEXTUALISÉE (ex: "Calculer mes économies solaires" au lieu de "En savoir plus")
4. VARIER les messages entre les bannières — JAMAIS deux bannières identiques
5. Le contenu doit donner ENVIE de cliquer : promettre un résultat concret, pas du vague

EXEMPLES DE BONNES BANNIÈRES :
[CTA_BANNER:xxx|Combien pourriez-vous économiser avec des panneaux solaires ?|Simulation personnalisée gratuite basée sur votre toiture et votre consommation réelle|Lancer ma simulation gratuite|opportunity]
[CTA_BANNER:xxx|⚡ Prime autoconsommation : les montants baissent en juillet|Profitez des barèmes actuels avant la prochaine révision trimestrielle|Vérifier mon éligibilité maintenant|urgent]
[CTA_BANNER:xxx|Un expert certifié RGE analyse votre projet gratuitement|Bilan énergétique complet + estimation des aides auxquelles vous avez droit|Demander mon bilan gratuit|trust]

MAUVAIS EXEMPLES (À NE JAMAIS FAIRE) :
❌ "Offre limitée !" / "Ne manquez pas cette opportunité !" / "Profitez-en maintenant !" → TROP VAGUE
❌ "En savoir plus" / "Cliquer ici" / "Découvrir" → AUCUNE VALEUR
❌ Deux bannières avec le même message → MONOTONE`;
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

      const systemPrompt = `Tu es un rédacteur SEO/GEO expert spécialisé énergies renouvelables et aides françaises.
DATE ACTUELLE: ${todayDate}. Tout le contenu doit être à jour. Utilise les chiffres, barèmes et réglementations en vigueur en ${new Date().getFullYear()}.
Tu rédiges UN SEUL article de HAUTE QUALITÉ optimisé lead/conversion ET référencement IA (GEO).

TYPE: ${contentTypeLabels[contentType] || 'article'}
PRODUIT À METTRE EN AVANT: ${product}
${subject ? `SUJET / TRAME: ${subject} (utilise ce sujet comme fil conducteur de l'article, les images et les données doivent être en rapport avec ce sujet, pas seulement le produit)` : ''}
THÈME: ${theme}
OBJECTIF: ${objectiveLabels[objective] || objective}
ANGLE ÉDITORIAL: [${selectedAngle.type}] ${selectedAngle.title}
INTENTION: ${selectedAngle.intention}
${keywords?.length > 0 ? `MOTS-CLÉS: ${keywords.join(', ')}` : ''}
${targetRegions?.length > 0 ? `RÉGIONS CIBLES: ${targetRegions.join(', ')}
IMPORTANT: Adapte le contenu aux spécificités de ces régions (aides locales, climat, réglementations, exemples locaux). Mentionne les régions naturellement dans le texte pour le SEO géographique.${targetRegions.includes('corse') || targetRegions.includes('reunion') || targetRegions.includes('martinique') || targetRegions.includes('guadeloupe') || targetRegions.includes('guyane') ? ' Inclus les spécificités DOM-TOM si applicable UNIQUEMENT si tu es CERTAIN que l\'aide existe pour ce type de produit. NE MENTIONNE PAS MaPrimeRénov Outre-mer pour des produits non éligibles (ex: batteries, onduleurs hybrides ne sont PAS éligibles à MaPrimeRénov).' : ''}` : ''}
${guideBlock}
${customInstructions ? `INSTRUCTIONS: ${customInstructions}` : ''}
${freePrompt ? `CONTRAINTES: ${freePrompt}` : ''}

═══════════════════════════════════════════
🚨 RÈGLE ANTI-HALLUCINATION — ZÉRO BULLSHIT (ÉLIMINATOIRE)
═══════════════════════════════════════════

⛔ NE JAMAIS INVENTER OU EXTRAPOLER DES INFORMATIONS :
- Si tu n'es PAS CERTAIN qu'une aide/subvention s'applique à un produit précis → NE LA MENTIONNE PAS
- MaPrimeRénov' : concerne UNIQUEMENT les équipements listés (PAC, isolation, VMC, chauffe-eau solaire/thermo, poêles à bois). Les BATTERIES SOLAIRES, ONDULEURS HYBRIDES, PANNEAUX SOLAIRES PHOTOVOLTAÏQUES ne sont PAS éligibles à MaPrimeRénov'.
- Les panneaux solaires photovoltaïques bénéficient de : prime à l'autoconsommation, tarif de rachat EDF OA, TVA 10%, parfois aides régionales — PAS de MaPrimeRénov'.
- Les batteries de stockage ne bénéficient d'AUCUNE aide nationale spécifique en ${new Date().getFullYear()} (sauf éventuelles aides locales/régionales à vérifier).
- NE PAS citer des chiffres ou montants d'aides si tu n'es pas SÛR qu'ils sont corrects et à jour.
- En cas de DOUTE sur un chiffre ou une aide → utilise une formulation prudente : "sous réserve d'éligibilité", "à vérifier sur france-renov.gouv.fr", ou NE LE MENTIONNE PAS.

⛔ TERMINOLOGIE FRANÇAISE OBLIGATOIRE :
- Utilise "kWc" (kilowatt-crête) et JAMAIS "kWp" — kWc est le standard français utilisé par tous les installateurs, l'ADEME et les particuliers.
- Utilise "kWh" pour l'énergie produite/consommée.
- Pas de jargon anglais inutile : "retour sur investissement" et non "ROI", "autoconsommation" et non "self-consumption".

⛔ VÉRIFICATION DES SOURCES :
- Ne cite QUE des sources officielles que tu sais exister : ADEME, France Rénov', service-public.fr, photovoltaique.info, Enedis, EDF OA.
- NE PAS inventer d'URLs. Si tu n'es pas sûr de l'URL exacte, cite juste le nom de l'organisme sans URL.
- Les chiffres de prix/coûts doivent être des FOURCHETTES réalistes, pas des montants trop précis qui pourraient être faux.

⛔ ORIENTATION CONVERSION (PAS TECHNIQUE) :
- L'article s'adresse à des PARTICULIERS, pas à des ingénieurs. Parler en langage SIMPLE.
- Chaque info technique doit être suivie d'une traduction concrète : "3 kWc, soit de quoi couvrir la consommation d'un foyer de 2-3 personnes"
- Toujours ramener à l'impact CONCRET pour le lecteur : économies en €, confort, autonomie, valorisation du bien
- Poser les questions COMME LES GENS LES POSENT : "Combien ça coûte ?", "Est-ce rentable ?", "Comment ça marche concrètement ?"

═══════════════════════════════════════════
PHILOSOPHIE DE RÉDACTION — PENSER COMME L'INTERNAUTE
═══════════════════════════════════════════

⚠️ AVANT D'ÉCRIRE, pose-toi ces questions fondamentales :
1. "Comment une personne réelle formulerait-elle sa recherche sur Google ou sur une IA (ChatGPT, Gemini) ?"
2. "Quelle est la VRAIE problématique derrière cette recherche ? Pas la surface, le VRAI problème."
3. "Quelles informations CONCRÈTES cette personne ne trouve PAS facilement chez les concurrents ?"
4. "Quel contenu ferait qu'un lecteur ENREGISTRE cet article ou le partage ?"

PRINCIPES DE QUALITÉ NON NÉGOCIABLES :
• RÉPONDRE À UNE VRAIE PROBLÉMATIQUE — Pas de contenu générique. Chaque section doit résoudre un point de douleur concret.
• APPORTER DE LA VALEUR UNIQUE — Inclure des infos qu'on ne retrouve PAS dans les 10 premiers résultats Google :
  - Chiffres précis avec sources et dates (pas "environ X€", mais "X€ selon [source] au ${todayDate}")
  - Exemples concrets avec montants réels (ex: "Pour une maison de 100m² à Lyon, le coût moyen est de...")
  - Pièges et erreurs que les gens font VRAIMENT (pas les erreurs évidentes)
  - Retours terrain / situations réelles (ex: "En pratique, les délais annoncés de 3 mois sont souvent de 5-6 mois car...")
  - Comparaisons honnêtes (avantages ET inconvénients)
• ÉCRIRE POUR LES IA — Les réponses des IA (ChatGPT, Gemini, Perplexity) extraient des articles bien structurés :
  - Réponses directes et factuelles dès les premières lignes de chaque section
  - Données chiffrées précises (les IA adorent les chiffres sourcés)
  - Phrases de synthèse claires en début de paragraphe (pattern "question → réponse directe → développement")
  - Listes à puces pour les points clés (les IA les citent facilement)
• TONALITÉ — Expert accessible. Parler comme un conseiller de confiance, pas comme un vendeur. Admettre les limites quand il y en a.

═══════════════════════════════════════════
STRUCTURE OBLIGATOIRE (suivre cet ordre)
═══════════════════════════════════════════

1. <h1>Titre (basé sur l'angle choisi, SANS préfixe de type. Formulé comme une VRAIE QUESTION que se poserait l'internaute, ou une réponse directe à sa recherche. SEO-friendly et naturel.)</h1>

2. <div class="summary-box" style="background:#f0f9ff;border-left:4px solid #0284c7;padding:1.5rem;margin:2rem 0;">
   <h2 style="margin-top:0;color:#0284c7;font-size:1.25rem;">📌 En résumé</h2>
   <ul><li>4-5 points clés CONCIS avec des CHIFFRES précis</li></ul>
   </div>
   IMPORTANT: Le contenu texte de ce bloc "En résumé" (TL;DR) ne doit PAS dépasser 500 caractères au total (tous les <li> combinés).
   Ce bloc doit contenir les réponses directes aux questions principales — c'est ce que les IA citeront.

3. Introduction (150-200 mots) — Commencer par la VRAIE QUESTION que se pose l'internaute. Montrer qu'on comprend son problème. Promettre une réponse concrète, pas du blabla.

4. Sections H2/H3 (4-7 sections) — CHAQUE section doit :
   - Avoir un H2 formulé comme une question ou problématique réelle (pas "Les avantages de X", mais "Combien économise-t-on réellement avec X ?")
   - Commencer par une RÉPONSE DIRECTE en 1-2 phrases (pour les extraits IA/featured snippets)
   - Contenir des données chiffrées SOURCÉES et DATÉES
   - Inclure au moins UN élément qu'on ne trouve pas facilement ailleurs (calcul concret, piège méconnu, retour terrain)
   - 200-350 mots par section

5. [BUTTON:CTA] — Call-to-action stratégiquement placés (2-3 dans l'article) avec des messages VARIÉS et contextuels

6. [CTA_BANNER:ID] — Bannière lead capture (1-2 dans l'article)

7. <h2>Questions fréquentes</h2>
    <div class="faq-item"><h3>Question ?</h3><p>Réponse.</p></div>
    RÈGLES FAQ CRITIQUES :
    - EXACTEMENT 4-5 questions (pas plus, pas moins). Sélectionner les MEILLEURES questions à fort potentiel de conversion.
    - Formulées EXACTEMENT comme un internaute les taperait sur Google ou demanderait à ChatGPT
    - Inclure les questions "gênantes" que les concurrents évitent (ex: "Est-ce que ça vaut vraiment le coup ?", "Quels sont les vrais inconvénients ?")
    - Réponses factuelles, précises, avec chiffres quand possible
    - Au moins 1 question doit aborder un aspect NÉGATIF ou une LIMITE (honnêteté = crédibilité)
    - Chaque réponse : 50-80 mots (concis et impactant)
    - ⚠️ NE PAS ajouter de questions FAQ ailleurs dans l'article. TOUTES les questions doivent être dans cette UNIQUE section FAQ.

8. <h2>Sources et références</h2>
   - Citer des sources VÉRIFIABLES et OFFICIELLES (ADEME, France Rénov, Journal Officiel, INSEE, etc.)
   - Donner les URLs complètes quand possible
   - Minimum 3 sources distinctes
   - Dater chaque source

9. Conclusion (100-150 mots) — Synthèse actionnable + passage à l'action CLAIR

═══════════════════════════════════════════
STRATÉGIE D'IMAGES (PERTINENCE > QUANTITÉ)
═══════════════════════════════════════════
⚠️ AVANT de rédiger, définis une STRATÉGIE D'IMAGES intelligente pour chaque section.

Pour CHAQUE section H2/H3, détermine si une image est pertinente (oui/non).
NE FORCE PAS une image partout — une image doit RENFORCER la compréhension ou la conversion.

TYPES D'IMAGES possibles (choisis le plus adapté) :
- Illustration réaliste : projection utilisateur, mise en situation concrète (ex: propriétaire devant sa maison avec panneaux)
- Schéma explicatif : fonctionnement technique, flux d'énergie, processus étape par étape
- Avant / Après : transformation visuelle (rénovation, factures, performance)
- Donnée / preuve visuelle : infographie de chiffres clés, graphique comparatif
- Mise en situation : photo contextuelle professionnelle (technicien, chantier, résultat final)
- Comparatif visuel : côte-à-côte de solutions, technologies, résultats

RÈGLES IMAGES :
- Maximum 1 image par section (pas plus)
- Entre 2 et 4 images TOTAL dans l'article (pas systématiquement 3)
- Chaque image doit être RADICALEMENT DIFFÉRENTE des autres (cadrage, sujet, type)
- La PREMIÈRE image doit être une vue large/hero en rapport DIRECT avec le sujet spécifique
- Les prompts doivent être ULTRA-PRÉCIS : 40+ mots, mention du cadrage, éclairage, style, éléments spécifiques
- JAMAIS d'images génériques (pas de "panneaux solaires sur un toit" si le sujet est les batteries)
- Style : photo éditoriale professionnelle, lumière naturelle, rendu magazine — PAS de rendu 3D/fake/IA visible

FORMAT du placeholder :
[IMAGE:TYPE_IMAGE|OBJECTIF_SECTION|Prompt détaillé ultra-précis de 40+ mots|Titre court de l'image|Légende descriptive visible sous l'image (source, contexte, crédit)]

Exemples :
[IMAGE:Mise en situation|Montrer le résultat concret d'une installation|Vue en contre-plongée d'une toiture résidentielle en tuiles terre cuite avec 12 panneaux solaires monocristallins noirs parfaitement alignés, ciel bleu avec quelques nuages, jardin verdoyant visible en premier plan, maison de style provençal, lumière dorée de fin d'après-midi, style photo reportage magazine architecture|Installation solaire résidentielle en Provence|Exemple d'une installation de 6 kWc sur une maison individuelle — Source : reportage terrain 2025]
[IMAGE:Avant/Après|Illustrer l'impact sur la facture|Split-screen horizontal montrant à gauche une facture EDF élevée avec montant 280€ entouré en rouge sur un bureau encombré, et à droite la même facture avec montant 45€ entouré en vert sur un bureau lumineux et ordonné, éclairage naturel, style photo documentaire|Comparaison facture avant/après solaire|Économie constatée après 1 an d'autoconsommation — Données moyennes clients 2024-2025]
[IMAGE:Schéma explicatif|Expliquer le fonctionnement technique|Infographie minimaliste sur fond blanc montrant le flux d'énergie solaire : panneau sur toit → onduleur → tableau électrique → appareils ménagers, avec flèches vertes et icônes flat design, chiffres de production en kWh annotés, style graphique professionnel épuré|Schéma du fonctionnement d'une installation solaire|Circuit de l'énergie : du panneau à vos appareils — Infographie simplifiée]

═══════════════════════════════════════════
TABLEAUX DE DONNÉES (OBLIGATOIRE — MINIMUM 1, IDÉALEMENT 2-3)
═══════════════════════════════════════════
⚠️ UN ARTICLE SANS TABLEAU EST INACCEPTABLE. Tu DOIS inclure au minimum 1 tableau HTML.
Les tableaux rendent l'article crédible, professionnel et référencé. Ils sont un critère SEO important.

QUAND UTILISER UN TABLEAU:
- Comparaison de prix, rendements, performances
- Barèmes d'aides par tranche de revenus/surface
- Évolution de tarifs/prix sur plusieurs années
- Fiches techniques de produits
- Récapitulatif d'économies selon différents scénarios
- Comparatif avant/après travaux

FORMAT OBLIGATOIRE (HTML propre avec classes CSS):
<div class="article-table-wrapper">
<table class="article-data-table">
<thead><tr><th>Colonne 1</th><th>Colonne 2</th><th>Colonne 3</th></tr></thead>
<tbody>
<tr><td>Valeur</td><td>Valeur</td><td>Valeur</td></tr>
<tr><td>Valeur</td><td>Valeur</td><td>Valeur</td></tr>
</tbody>
</table>
<p class="table-source">Source : organisme officiel, année</p>
</div>

RÈGLES TABLEAUX:
- TOUJOURS citer la source officielle sous le tableau
- 3 à 6 colonnes max, 4 à 10 lignes max
- Données RÉALISTES et ACTUELLES (${new Date().getFullYear()})
- Placer les tableaux dans les sections où ils apportent une preuve chiffrée
- Le 1er tableau doit apparaître dans les sections 1-3 de l'article
- NE PAS mettre de styles inline sur les cellules (les classes CSS s'en chargent)

═══════════════════════════════════════════
RÈGLES GÉNÉRALES
═══════════════════════════════════════════
• Entre 2 et 4 [IMAGE:...] intelligemment placés selon la stratégie (pertinence > quantité)
• HTML pur (<p>, <ul>, <h2>, <h3>, <table>). Jamais de markdown.
• ${contentType === 'guide' ? '2000-3000 mots' : '1500-2200 mots'} — assez long pour être exhaustif, assez concis pour garder l'attention
• Style direct, impactant, zéro blabla — chaque phrase doit APPORTER quelque chose
• Chaque section sert l'objectif lead ET répond à une vraie question
• Pas de paraphrase inutile, pas de phrases creuses ("il est important de noter que...")
• ⚠️ MINIMUM 1 tableau de données HTML (OBLIGATOIRE), idéalement 2-3. UN ARTICLE SANS TABLEAU EST REJETÉ.
• Les CTA doivent avoir des MESSAGES VARIÉS et CONTEXTUELS (pas 3x "Demander un devis" — adapter au contexte de la section)
• HONNÊTETÉ : mentionner les limites et inconvénients quand ils existent — ça renforce la crédibilité
• SPÉCIFICITÉ : préférer "2 847€ en moyenne selon l'ADEME (2025)" à "plusieurs milliers d'euros"
• ANTI-GÉNÉRIQUE : si une phrase pourrait s'appliquer à n'importe quel sujet, la réécrire ou la supprimer
• ⚠️ COHÉRENCE STRUCTURELLE : L'article doit former UN TOUT cohérent. PAS de sections en double (une seule FAQ, un seul TL;DR, pas de questions dispersées dans le corps de l'article).
• L'article suit un flux logique : TL;DR → Intro → Sections → CTA → FAQ → Sources → Conclusion. Chaque bloc n'apparaît QU'UNE SEULE FOIS.
${ctaInstructions}

═══════════════════════════════════════════
CLASSIFICATION (OBLIGATOIRE)
═══════════════════════════════════════════
À la toute fin du HTML, ajoute un commentaire invisible avec la catégorie et les étiquettes les plus pertinentes parmi celles disponibles.

RÈGLE CRITIQUE DE CLASSIFICATION:
- La catégorie doit correspondre au PRODUIT principal ("${product}") et au SUJET de l'article${subject ? ` ("${subject}")` : ''}.
- NE CHOISIS PAS "chauffage" par défaut ! Analyse le contenu réel :
  * Si l'article parle de panneaux solaires/photovoltaïque → catégorie "solaire" ou "photovoltaique"
  * Si l'article parle d'isolation → catégorie "isolation"
  * Si l'article parle de pompe à chaleur → catégorie "pompe-a-chaleur"
  * Si l'article parle de ventilation/VMC → catégorie "ventilation"
  * Si l'article parle d'économies d'énergie → catégorie "economies-d-energie"
  * Si l'article parle de rénovation globale → catégorie "renovation-globale"
  * "chauffage" UNIQUEMENT si le sujet porte spécifiquement sur le chauffage (chaudière, radiateurs, etc.)

${availableCategories?.length > 0 ? `CATÉGORIES DISPONIBLES (choisis parmi celles-ci UNIQUEMENT): ${availableCategories.map((c: any) => `"${c.name}" (slug: ${c.slug})`).join(', ')}` : ''}
${availableTags?.length > 0 ? `ÉTIQUETTES DISPONIBLES: ${availableTags.map((t: any) => `"${t.name}" (slug: ${t.slug})`).join(', ')}` : ''}
FORMAT (dernière ligne du HTML): <!-- CLASSIFY:category=${availableCategories?.length > 0 ? 'slug_categorie' : 'none'}|tags=${availableTags?.length > 0 ? 'slug1,slug2,slug3' : 'none'} -->
Choisis la catégorie LA PLUS pertinente par rapport au produit "${product}" et 2-4 étiquettes qui correspondent au contenu.

Retourne UNIQUEMENT le HTML.`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({
          model, max_tokens: 8192,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Rédige l'article complet avec l'angle [${selectedAngle.type}]: "${selectedAngle.title}"` }
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
      const articleUsage = data.usage || {};
      let content = data.choices[0].message.content;

      // Clean & convert
      content = cleanHtml(content, ctaBanners, buttonPresets, defaultPopupId);
      const faq = extractFaq(content);
      const tldr = extractTldr(content);

      // CRITICAL: Remove FAQ section and summary-box from HTML content
      // These are rendered as separate React components (Accordion FAQ, TL;DR box)
      content = content
        .replace(/<div class="summary-box"[^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<h2[^>]*>\s*(?:❓\s*)?Questions?\s*fr[ée]quentes?\s*<\/h2>[\s\S]*?(?=<h2[^>]*>(?!Questions)|$)/gi, '')
        .trim();

      // Extract classification (robust parsing + fallback inference)
      const classifyMatch = content.match(/<!--\s*CLASSIFY:category=([^|]*)\|tags=([^>]*)\s*-->/i);
      let suggestedCategorySlug = '';
      let suggestedTagSlugs: string[] = [];

      if (classifyMatch) {
        suggestedCategorySlug = (classifyMatch[1] || '').trim();
        suggestedTagSlugs = (classifyMatch[2] || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
      }

      // Remove classify comment from content (if present)
      content = content.replace(/<!--\s*CLASSIFY:[^>]*-->/gi, '').trim();

      const normalize = (value: string) =>
        (value || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

      const categoryList = Array.isArray(availableCategories) ? availableCategories : [];
      const tagList = Array.isArray(availableTags) ? availableTags : [];

      const categorySlugMap = new Map<string, string>(
        categoryList.map((c: any) => [normalize(String(c.slug || '')), String(c.slug || '')])
      );
      const tagSlugMap = new Map<string, string>(
        tagList.map((t: any) => [normalize(String(t.slug || '')), String(t.slug || '')])
      );

      const normalizedSuggestedCategory = normalize(suggestedCategorySlug);
      if (!normalizedSuggestedCategory || !categorySlugMap.has(normalizedSuggestedCategory) || normalizedSuggestedCategory === 'none') {
        const context = normalize([
          product,
          subject,
          selectedAngle?.title,
          selectedAngle?.intention,
          content,
        ].filter(Boolean).join(' '));

        const pickFirstAvailable = (candidates: string[]) => {
          for (const candidate of candidates) {
            const resolved = categorySlugMap.get(normalize(candidate));
            if (resolved) return resolved;
          }
          return '';
        };

        const categoryRules = [
          {
            keywords: ['solaire', 'photovolt', 'panneau', 'autoconsommation', 'edf-oa', 'surplus', 'batterie', 'onduleur', 'kwc'],
            slugs: ['solaire', 'photovoltaique', 'electricite']
          },
          {
            keywords: ['pompe-a-chaleur', 'pac', 'air-eau', 'air-air'],
            slugs: ['pompe-a-chaleur']
          },
          {
            keywords: ['isolation', 'combles', 'ite', 'toiture', 'murs'],
            slugs: ['isolation']
          },
          {
            keywords: ['ventilation', 'vmc', 'double-flux', 'simple-flux'],
            slugs: ['ventilation']
          },
          {
            keywords: ['renovation-globale', 'renovation-energetique', 'bouquet-de-travaux'],
            slugs: ['renovation-globale']
          },
          {
            keywords: ['electricite', 'electrique', 'reseau', 'compteur', 'linky'],
            slugs: ['electricite']
          },
          {
            keywords: ['economies-d-energie', 'economies-energie', 'facture', 'consommation'],
            slugs: ['economies-energie', 'economies-d-energie']
          },
          {
            keywords: ['subvention', 'aides', 'prime', 'maprimerenov', 'cee'],
            slugs: ['subventions']
          },
          {
            keywords: ['chauffage', 'chaudiere', 'radiateur', 'poele'],
            slugs: ['chauffage']
          },
        ];

        suggestedCategorySlug = '';
        for (const rule of categoryRules) {
          if (rule.keywords.some((keyword) => context.includes(normalize(keyword)))) {
            const resolved = pickFirstAvailable(rule.slugs);
            if (resolved) {
              suggestedCategorySlug = resolved;
              break;
            }
          }
        }
      } else {
        suggestedCategorySlug = categorySlugMap.get(normalizedSuggestedCategory) || '';
      }

      // Keep only valid tags; infer from context if missing
      suggestedTagSlugs = suggestedTagSlugs
        .map((slug) => tagSlugMap.get(normalize(slug)) || '')
        .filter(Boolean);

      if (suggestedTagSlugs.length === 0 && tagList.length > 0) {
        const context = normalize([
          product,
          subject,
          selectedAngle?.title,
          selectedAngle?.intention,
          ...((keywords || []) as string[]),
          content,
        ].filter(Boolean).join(' '));

        const tagRules: Array<{ keywords: string[]; slugs: string[] }> = [
          { keywords: ['solaire', 'photovolt', 'panneau'], slugs: ['solaire', 'photovoltaique', 'panneaux-solaires'] },
          { keywords: ['batterie', 'stockage', 'backup'], slugs: ['batteries'] },
          { keywords: ['edf-oa', 'surplus', 'revente'], slugs: ['electricite'] },
          { keywords: ['maprimerenov', 'cee', 'prime', 'aides'], slugs: ['maprimerenov', 'cee', 'aides-primes'] },
        ];

        const inferred: string[] = [];
        for (const rule of tagRules) {
          if (rule.keywords.some((keyword) => context.includes(normalize(keyword)))) {
            for (const slug of rule.slugs) {
              const resolved = tagSlugMap.get(normalize(slug));
              if (resolved && !inferred.includes(resolved)) inferred.push(resolved);
              if (inferred.length >= 4) break;
            }
          }
          if (inferred.length >= 4) break;
        }
        suggestedTagSlugs = inferred;
      }

      // Estimate cost from token usage (Gemini Flash pricing ~$0.10/1M input, ~$0.40/1M output)
      const promptTokens = articleUsage.prompt_tokens || 0;
      const completionTokens = articleUsage.completion_tokens || 0;
      const estimatedCost = parseFloat(((promptTokens * 0.0001 + completionTokens * 0.0004) / 1000).toFixed(4));

      const article = {
        title: extractTitle(content),
        content,
        excerpt: generateExcerpt(content),
        metaTitle: extractMetaTitle(content),
        metaDescription: extractMetaDescription(content),
        focusKeywords: keywords || [],
        tldr,
        faq,
        suggestedCategorySlug,
        suggestedTagSlugs,
      };

      return new Response(
        JSON.stringify({ success: true, article, usage: { promptTokens, completionTokens, estimatedCost } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ══════════════════════════════════════════
    // MODE: REVIEW — AI proofreading of article
    // ══════════════════════════════════════════
    if (mode === 'review') {
      const { title, content, contentType: reviewContentType, categoryName,
              excerpt, metaTitle, metaDescription, focusKeywords, targetRegions,
              faq, tldr, tagNames, featuredImage } = body;
      if (!content) throw new Error('Contenu requis pour la relecture');

      const faqSection = Array.isArray(faq) && faq.length > 0
        ? `\n\nFAQ FOURNIES (${faq.length} questions):\n${faq.map((f: any, i: number) => `Q${i+1}: ${f.question}\nR${i+1}: ${f.answer}`).join('\n\n')}`
        : '\n\nFAQ: AUCUNE FAQ fournie';

      const keywordsInfo = Array.isArray(focusKeywords) && focusKeywords.length > 0
        ? focusKeywords.join(', ') : 'Aucun';
      const regionsInfo = Array.isArray(targetRegions) && targetRegions.length > 0
        ? targetRegions.join(', ') : 'Aucune';
      const tagsInfo = Array.isArray(tagNames) && tagNames.length > 0
        ? tagNames.join(', ') : 'Aucun';

      const reviewPrompt = `Tu es un rédacteur en chef exigeant et méticuleux spécialisé dans les articles sur les énergies renouvelables.
Tu dois relire et auditer L'INTÉGRALITÉ du contenu éditorial fourni (pas seulement le corps de l'article).
Analyse CHAQUE aspect ci-dessous et attribue une note /10 + un commentaire honnête.
Sois CONSTRUCTIF mais SANS COMPLAISANCE. Si c'est moyen, dis-le.

DATE ACTUELLE: ${todayDate}

═══════════════════════════════════════
DONNÉES COMPLÈTES À AUDITER
═══════════════════════════════════════
Titre: ${title || 'MANQUANT ⚠️'}
Catégorie: ${categoryName || 'Non spécifiée ⚠️'}
Type: ${reviewContentType || 'actualite'}
Tags: ${tagsInfo}
Mots-clés ciblés (SEO/GEO): ${keywordsInfo}
Régions ciblées: ${regionsInfo}
Image à la une: ${featuredImage ? 'Présente ✅' : 'ABSENTE ⚠️'}

— EXTRAIT / CHAPÔ —
${excerpt || 'AUCUN extrait fourni ⚠️'}

— TL;DR —
${tldr || 'AUCUN TL;DR fourni ⚠️'}

— MÉTA SEO —
Meta Title: ${metaTitle || 'ABSENT ⚠️'}
Meta Description: ${metaDescription || 'ABSENTE ⚠️'}
${faqSection}

— CONTENU HTML (corps de l'article) —
${content.slice(0, 12000)}

═══════════════════════════════════════
CRITÈRES D'AUDIT (note /10 + commentaire pour chacun)
═══════════════════════════════════════
1. COHÉRENCE GLOBALE - Le fil rouge est clair ? Les sections s'enchaînent logiquement ? Pas de contradictions ?
2. QUALITÉ RÉDACTIONNELLE - Style, ton, fluidité, richesse du vocabulaire, pas de répétitions
3. SEO & STRUCTURE - H2/H3 bien utilisés, mots-clés présents dans le contenu ET les méta (meta title <60 car, meta desc <160 car), densité correcte. Le titre est-il optimisé SEO ?
4. DONNÉES & CHIFFRES - Présence de tableaux HTML, données chiffrées sourcées, actuelles (${new Date().getFullYear()})
5. CTA & CONVERSION - Variété des couleurs/styles des CTA, pertinence des placements, diversité des messages. CRITIQUE: Vérifie si les boutons (data-custom-button) et bandeaux CTA (data-cta-banner) ont un data-popup-id renseigné ou un lien valide (pas juste "#" ou "#contact"). Si un CTA n'est connecté à rien, c'est un PROBLÈME BLOQUANT à signaler en priorité (note 0/10 automatique si CTA non connecté détecté).
6. IMAGES & LÉGENDES - Images distinctes et pertinentes au sujet (vérifier dans le HTML), image à la une présente, légendes (figcaption) descriptives et informatives (pas vides ni génériques), alt text optimisé SEO
7. FAQ - Les FAQ sont-elles fournies ? Questions pertinentes, utiles et variées ? Réponses complètes ? (${Array.isArray(faq) && faq.length > 0 ? faq.length + ' FAQ détectées' : '⚠️ AUCUNE FAQ'})
8. ORIGINALITÉ - L'article apporte-t-il une vraie valeur ? Pas trop "template" ou monotone ?
9. COMPLÉTUDE ÉDITORIALE - Extrait/chapô renseigné ? TL;DR ? Image à la une ? Tags ? Mots-clés SEO ? Régions ciblées ?

═══════════════════════════════════════
PROBLÈMES DÉTECTÉS (liste exhaustive)
═══════════════════════════════════════
Liste chaque problème concret trouvé avec:
- Localisation (champ du formulaire ou section de l'article)
- Nature du problème
- Suggestion de correction

═══════════════════════════════════════
SUGGESTIONS D'AMÉLIORATION
═══════════════════════════════════════
3-5 suggestions concrètes pour améliorer significativement l'article ET ses métadonnées.

RETOURNE un JSON VALIDE (sans markdown ni backticks) :
{
  "score_global": 7.5,
  "verdict": "Phrase résumé courte du verdict global",
  "criteres": [
    { "nom": "Cohérence globale", "note": 8, "commentaire": "..." },
    { "nom": "Qualité rédactionnelle", "note": 7, "commentaire": "..." },
    { "nom": "SEO & Structure", "note": 6, "commentaire": "..." },
    { "nom": "Données & Chiffres", "note": 5, "commentaire": "..." },
    { "nom": "CTA & Conversion", "note": 4, "commentaire": "..." },
    { "nom": "Images", "note": 7, "commentaire": "..." },
    { "nom": "FAQ", "note": 8, "commentaire": "..." },
    { "nom": "Originalité", "note": 6, "commentaire": "..." },
    { "nom": "Complétude éditoriale", "note": 5, "commentaire": "..." }
  ],
  "problemes": [
    { "localisation": "Champ: Meta Title", "probleme": "...", "suggestion": "..." }
  ],
  "suggestions": [
    "Suggestion 1...",
    "Suggestion 2..."
  ],
  "tableaux_presents": true,
  "nb_cta": 3,
  "cta_couleurs_variees": false,
  "nb_images": 3,
  "nb_faq": ${Array.isArray(faq) ? faq.length : 0},
  "champs_manquants": []
}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          temperature: 0.3,
          messages: [
            { role: 'system', content: reviewPrompt },
            { role: 'user', content: `Relis et audite cet article de manière critique et exhaustive.` }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erreur API IA: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const raw = data.choices[0].message.content.trim().replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

      let review;
      try { review = JSON.parse(raw); } catch { throw new Error('Format de réponse de relecture invalide'); }

      return new Response(
        JSON.stringify({ success: true, review }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ══════════════════════════════════════════
    // MODE: REVIEW_FIX — Apply corrections from review
    // ══════════════════════════════════════════
    if (mode === 'review_fix') {
      const { title, content, contentType: fixContentType, problemes, suggestions, userId: fixUserId } = body;
      if (!content) throw new Error('Contenu requis pour la correction');

      // Load user's CTA presets (same as article mode)
      let buttonPresets: any[] = [];
      let ctaBanners: any[] = [];
      let activePopups: any[] = [];

      if (fixUserId) {
        const [buttonsRes, bannersRes, popupsRes] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/button_presets?select=*&user_id=eq.${fixUserId}`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          }),
          fetch(`${supabaseUrl}/rest/v1/cta_banners?select=*&user_id=eq.${fixUserId}`, {
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

      // Build CTA instructions for the fix prompt
      let ctaFixInstructions = '';
      const shuffledBtns = shuffleArray([...buttonPresets]).slice(0, 3);
      if (shuffledBtns.length > 0) {
        ctaFixInstructions += `\nBOUTONS CTA DISPONIBLES (si tu en ajoutes):
${shuffledBtns.map((b: any, i: number) => `${i + 1}. "${b.text}" → ${b.url} (couleur: ${b.background_color || '#10b981'})`).join('\n')}
FORMAT AJOUT BOUTON: [BUTTON:Texte|URL]`;
      }
      const shuffledBnrs = shuffleArray([...ctaBanners]).slice(0, 2);
      if (shuffledBnrs.length > 0) {
        ctaFixInstructions += `\nBANNIÈRES CTA DISPONIBLES (si tu en ajoutes):
${shuffledBnrs.map((b: any) => `ID="${b.id}" Titre="${b.title}"`).join('\n')}
FORMAT AJOUT BANNIÈRE: [CTA_BANNER:ID]`;
      }

      const issuesList = (problemes || []).map((p: any, i: number) => 
        `${i + 1}. [${p.localisation}] ${p.probleme} → Correction: ${p.suggestion}`
      ).join('\n');

      const suggestionsList = (suggestions || []).map((s: string, i: number) =>
        `${i + 1}. ${s}`
      ).join('\n');

      const fixPrompt = `Tu es un rédacteur expert en énergies renouvelables. Tu dois CORRIGER et AMÉLIORER un article HTML existant.

DATE ACTUELLE: ${todayDate}
ARTICLE TYPE: ${fixContentType || 'actualite'}
TITRE: ${title || 'Sans titre'}

═══════════════════════════════════════
RÈGLES CRITIQUES
═══════════════════════════════════════
- Tu reçois le HTML complet de l'article et une liste de problèmes détectés + suggestions d'amélioration.
- Tu dois retourner le HTML CORRIGÉ COMPLET (pas juste les morceaux modifiés).
- CONSERVE intégralement: tous les data-custom-button, data-cta-banner, data-custom-image, <table> existants.
- NE SUPPRIME AUCUN élément interactif (boutons, bannières CTA, images existantes).
- NE CHANGE PAS la structure des CTA/boutons EXISTANTS (leurs attributs data-*).
- IMAGES EXISTANTES : tu PEUX et DOIS améliorer les <figcaption> (légendes) et attributs alt des images existantes si elles sont vides, génériques ou peu descriptives. Rends-les précises, informatives et contextuelles par rapport au contenu de la section.
- Corrige le texte rédactionnel, la structure des H2/H3, l'ajout de données manquantes.
- Si un tableau est manquant, ajoute-en un avec la classe "article-data-table".
- Utilise "kWc" (pas kWp).
- Ne mens pas, n'invente pas de données.

═══════════════════════════════════════
AJOUTS AUTORISÉS (si manquants)
═══════════════════════════════════════
Si l'audit a détecté des éléments MANQUANTS, tu PEUX et DOIS les ajouter :

📸 IMAGES MANQUANTES :
Si l'article n'a pas assez d'images (idéalement 2-4), ajoute des placeholders :
[IMAGE:TYPE|OBJECTIF|Prompt détaillé ultra-précis de 40+ mots|Titre court|Légende descriptive]
Types : Illustration réaliste, Schéma explicatif, Avant/Après, Donnée/preuve visuelle, Mise en situation, Comparatif visuel.
Chaque image doit être pertinente au sujet spécifique et radicalement différente des autres.
Style : photo éditoriale professionnelle, lumière naturelle, rendu magazine — PAS de rendu 3D/fake.

🔘 CTA MANQUANTS :
Si l'article manque de CTA (idéalement 2-3 boutons + 1-2 bannières), utilise les presets ci-dessous.
${ctaFixInstructions || 'FORMAT BOUTON: [BUTTON:Demander un devis gratuit|#contact]'}

📊 TABLEAUX MANQUANTS :
Si aucun tableau n'est présent, ajoute au minimum 1 tableau avec classe "article-data-table".
<div class="article-table-wrapper">
<table class="article-data-table">
<thead><tr><th>...</th></tr></thead>
<tbody><tr><td>...</td></tr></tbody>
</table>
<p class="table-source">Source : organisme officiel, année</p>
</div>

═══════════════════════════════════════
PROBLÈMES À CORRIGER
═══════════════════════════════════════
${issuesList || 'Aucun problème spécifique'}

═══════════════════════════════════════
SUGGESTIONS À APPLIQUER
═══════════════════════════════════════
${suggestionsList || 'Aucune suggestion spécifique'}

Retourne UNIQUEMENT le HTML corrigé, rien d'autre. Pas de markdown, pas de backticks, pas d'explication.`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({
          model,
          max_tokens: 8192,
          temperature: 0.2,
          messages: [
            { role: 'system', content: fixPrompt },
            { role: 'user', content: content.slice(0, 15000) }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erreur API IA: ${response.status} - ${errText}`);
      }

      const data = await response.json();
      const fixUsage = data.usage || {};
      let fixedContent = data.choices[0].message.content.trim()
        .replace(/```html\s*/gi, '').replace(/```\s*/g, '').trim();

      // Convert placeholders to internal format (same as article mode)
      fixedContent = cleanHtml(fixedContent, ctaBanners, buttonPresets, defaultPopupId);

      const estimatedFixCost = fixUsage.prompt_tokens && fixUsage.completion_tokens
        ? ((fixUsage.prompt_tokens * 0.075 + fixUsage.completion_tokens * 0.3) / 1_000_000)
        : null;

      return new Response(
        JSON.stringify({ success: true, fixedContent, usage: fixUsage, fixCost: estimatedFixCost }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ══════════════════════════════════════════
    // MODE: IMAGE_PROMPT — Generate a smart image prompt from context
    // ══════════════════════════════════════════
    if (mode === 'image_prompt') {
      const { context, contextLabel } = body;
      if (!context) throw new Error('Contexte requis');

      const promptGenResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({
          model,
          max_tokens: 512,
          temperature: 0.7,
          messages: [
            { role: 'system', content: `Tu es un expert en création de prompts pour la génération d'images éditoriales. Tu dois créer UN SEUL prompt détaillé (40-80 mots) pour générer une image professionnelle percutante et virale pour ${contextLabel === 'image à la une' ? 'la une d\'un article' : 'une section d\'article'} sur les énergies renouvelables.

RÈGLES:
- Photo réaliste, lumière naturelle, rendu magazine professionnel
- PAS de rendu 3D, pas d'illustration cartoon, pas de stock photo générique
- L'image doit être ENGAGEANTE et donner envie de lire
- Inclure des détails précis: angle de vue, éclairage, composition, éléments humains si pertinent
- Adapter au contexte fourni

Retourne UNIQUEMENT le prompt, rien d'autre.` },
            { role: 'user', content: `Contexte de l'article/section:\n${context.slice(0, 2000)}` }
          ]
        })
      });

      if (!promptGenResponse.ok) throw new Error('Erreur génération prompt image');
      const promptData = await promptGenResponse.json();
      const generatedPrompt = promptData.choices[0].message.content.trim();

      return new Response(
        JSON.stringify({ success: true, prompt: generatedPrompt }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    throw new Error(`Mode inconnu: ${mode}. Utilisez "angles", "article", "review", "review_fix" ou "image_prompt".`);

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
  // IMPORTANT: Do NOT convert [IMAGE:...] placeholders here!
  // They must remain as raw text so the client-side can parse them
  // and call the generate-images edge function to create actual images.
  
  // Only wrap standalone <img> tags (already resolved images) in figures
  return html.replace(/<img([^>]*)>/g, (match) => {
    if (match.includes('data-custom-image') || match.includes('data-image-prompt')) return match;
    return `<figure data-custom-image class="custom-image-wrapper my-4" style="text-align:center">${match.replace(/>$/, ' style="max-width:100%;height:auto;border-radius:8px">')}</figure>`;
  });
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
  const text = items ? items.map(i => i.replace(/<[^>]*>/g,'').trim()).join('\n') : '';
  return text.length <= 500 ? text : text.slice(0, 497) + '...';
}
function extractFaq(html: string): Array<{question:string;answer:string}> {
  const faq: Array<{question:string;answer:string}> = [];
  // Match the FAQ section (various heading formats)
  const m = html.match(/<h2[^>]*>\s*(?:❓\s*)?Questions?\s*fr[ée]quentes?\s*<\/h2>([\s\S]*?)(?=<h2[^>]*>(?!\s*(?:❓\s*)?Questions)|$)/i);
  if (!m) return faq;
  const section = m[1];
  // Try faq-item divs first
  const items = section.match(/<div class="faq-item"[^>]*>([\s\S]*?)<\/div>/gi);
  if (items) {
    items.forEach(item => {
      const q = item.match(/<h3[^>]*>(.*?)<\/h3>/is);
      const a = item.match(/<p[^>]*>([\s\S]*?)<\/p>/is);
      if (q && a) faq.push({ question: q[1].replace(/<[^>]*>/g,'').trim(), answer: a[1].replace(/<[^>]*>/g,'').trim() });
    });
  }
  // Fallback: extract h3 + p pairs directly
  if (faq.length === 0) {
    const h3Matches = [...section.matchAll(/<h3[^>]*>(.*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi)];
    h3Matches.forEach(match => {
      faq.push({ question: match[1].replace(/<[^>]*>/g,'').trim(), answer: match[2].replace(/<[^>]*>/g,'').trim() });
    });
  }
  // Cap at 5 best questions
  return faq.slice(0, 5);
}
