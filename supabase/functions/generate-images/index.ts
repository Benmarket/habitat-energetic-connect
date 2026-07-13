import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';
import { requireAuth } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 🔒 Strict JWT + admin role check
    const auth = await requireAuth(req, { corsHeaders, requireAdmin: true });
    if (!auth.ok) return auth.response;
    const { userId, supabaseAdmin } = auth;

    // Rate limit anti-abus
    const { data: canProceed } = await supabaseAdmin
      .rpc('check_ai_rate_limit', { p_user_id: userId, p_endpoint: 'generate-images', p_max_per_hour: 20 });
    if (canProceed === false) {
      return new Response(
        JSON.stringify({ success: false, error: 'Limite atteinte : 20 générations d\'images maximum par heure.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    await supabaseAdmin.rpc('record_ai_call', { p_user_id: userId, p_endpoint: 'generate-images' });

    const body = await req.json();
    const { imageDescriptions, mode, sourceImageUrl, editInstructions, context } = body as {
      imageDescriptions?: string[];
      mode?: 'edit' | 'fresh';
      sourceImageUrl?: string;
      editInstructions?: string;
      context?: string;
    };

    const isEdit = mode === 'edit' && !!sourceImageUrl && !!editInstructions;

    if (!isEdit && (!imageDescriptions || imageDescriptions.length === 0)) {
      throw new Error('Au moins une description d\'image est requise');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = supabaseAdmin;

    // En mode édition : télécharge l'image source et convertit en base64 pour la passer au modèle
    let sourceImageDataUrl: string | null = null;
    if (isEdit) {
      try {
        const imgRes = await fetch(sourceImageUrl!);
        if (!imgRes.ok) throw new Error(`fetch source image ${imgRes.status}`);
        const contentType = imgRes.headers.get('content-type') || 'image/png';
        const buf = new Uint8Array(await imgRes.arrayBuffer());
        let bin = '';
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        const b64 = btoa(bin);
        sourceImageDataUrl = `data:${contentType};base64,${b64}`;
      } catch (e) {
        console.error('[generate-images] source fetch failed', e);
        throw new Error(`Impossible de récupérer l'image source pour retouche`);
      }
    }

    // Liste unique de "tâches" (édition = 1 seule tâche)
    const tasks: Array<{ description: string; edit: boolean }> = isEdit
      ? [{ description: editInstructions!, edit: true }]
      : imageDescriptions!.map((d) => ({ description: d, edit: false }));

    const generatedImages = await Promise.all(
      tasks.map(async ({ description, edit }, index: number) => {
        try {
          const userContent = edit
            ? [
                {
                  type: 'text',
                  text: `Tu vas RETOUCHER l'image fournie ci-dessous. Conserve à l'IDENTIQUE la composition, le cadrage, le style, la palette de couleurs, l'éclairage et les personnages/objets. Applique UNIQUEMENT les modifications suivantes, avec précision : ${description}. Si l'image contient du texte, corrige-le sans changer la typographie ni la mise en page. Ne rajoute AUCUN élément non demandé.${context ? ` Contexte éditorial (informatif seulement) : ${context}` : ''}`
                },
                { type: 'image_url', image_url: { url: sourceImageDataUrl } }
              ]
            : `Génère une image professionnelle, haute qualité, photo réaliste. Description exacte à suivre : ${description}. Style : moderne, lumineux, engageant, adapté à un article web. Ne rajoute AUCUN élément qui ne correspond pas à la description.`;

          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image',
              messages: [{ role: 'user', content: userContent }],
              modalities: ['image', 'text']
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur génération image ${index + 1}: ${response.status}`);
          }

          const data = await response.json();
          const imageBase64 = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          
          if (!imageBase64) {
            throw new Error(`Aucune image générée pour: ${description}`);
          }

          // Convertir base64 en blob
          const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          
          // Upload vers Supabase Storage
          const filename = `generated-${Date.now()}-${index}.png`;
          const storagePath = `${userId}/${filename}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('media')
            .upload(storagePath, buffer, {
              contentType: 'image/png',
              upsert: false
            });

          if (uploadError) {
            throw new Error(`Erreur upload image ${index + 1}`);
          }

          // Obtenir l'URL publique
          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(storagePath);

          // Enregistrer dans la table media avec l'URL publique
          const { data: mediaData, error: mediaError } = await supabase
            .from('media')
            .insert({
              user_id: userId,
              filename: filename,
              storage_path: publicUrl,
              alt_text: description,
              mime_type: 'image/png'
            })
            .select()
            .single();

          if (mediaError) {
            throw new Error(`Erreur enregistrement media ${index + 1}`);
          }

          return {
            url: publicUrl,
            description: description,
            success: true
          };
        } catch (error) {
          return {
            url: '',
            description: description,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const successCount = generatedImages.filter(img => img.success).length;

    return new Response(
      JSON.stringify({ 
        success: true,
        images: generatedImages
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
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
