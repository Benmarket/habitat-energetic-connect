import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageDescriptions, userId } = await req.json();
    
    if (!imageDescriptions || imageDescriptions.length === 0) {
      throw new Error('Au moins une description d\'image est requise');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Generating images with Lovable AI:', imageDescriptions.length, 'images');

    // Générer toutes les images en parallèle
    const generatedImages = await Promise.all(
      imageDescriptions.map(async (description: string, index: number) => {
        try {
          const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image',
              messages: [{
                role: 'user',
                content: `Crée une image professionnelle et attrayante pour un article sur les énergies renouvelables avec cette description : ${description}. Style moderne, lumineux et engageant.`
              }],
              modalities: ['image', 'text']
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Lovable AI error for image', index, ':', response.status, errorText);
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
            console.error('Upload error:', uploadError);
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
            console.error('Media insert error:', mediaError);
            throw new Error(`Erreur enregistrement media ${index + 1}`);
          }

          return {
            url: publicUrl,
            description: description,
            success: true
          };
        } catch (error) {
          console.error(`Error generating image ${index}:`, error);
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
    console.log(`Successfully generated ${successCount}/${imageDescriptions.length} images`);

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
    console.error('Error in generate-images:', error);
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
