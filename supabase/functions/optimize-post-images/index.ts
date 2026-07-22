// Optimise les images d'un article (featured_image + <img> dans le contenu)
// en les convertissant en WebP (via l'API Supabase Storage Transformation),
// puis en réécrivant les URLs pour pointer vers la variante WebP à la volée.
//
// C'est un job de fond, tolérant aux erreurs : si la transformation d'image
// n'est pas dispo, on tombe simplement en no-op sans casser la publication.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Convertit une URL Storage publique `object/public/media/...`
// en URL de rendu WebP `render/image/public/media/...?format=webp&quality=78`.
// Retourne l'URL originale si le format n'est pas convertible.
function toWebpUrl(url: string): string {
  if (!url) return url;
  if (!url.includes("/storage/v1/object/public/")) return url;
  // Ne re-traite pas si déjà en webp
  if (/\.(webp|avif|svg)(\?|$)/i.test(url)) return url;
  const converted = url
    .replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
  const sep = converted.includes("?") ? "&" : "?";
  return `${converted}${sep}format=webp&quality=78&resize=contain&width=1600`;
}

function rewriteContent(html: string): string {
  if (!html) return html;
  return html.replace(/(<img\b[^>]*\bsrc=)("|')([^"']+)\2/gi, (_m, pre, quote, src) => {
    return `${pre}${quote}${toWebpUrl(src)}${quote}`;
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { postId } = await req.json();
    if (!postId) return new Response(JSON.stringify({ error: "postId required" }), { status: 400, headers: corsHeaders });

    const bgTask = (async () => {
      try {
        const { data: post } = await admin
          .from("posts")
          .select("id, content, featured_image")
          .eq("id", postId)
          .maybeSingle();
        if (!post) return;

        const newContent = rewriteContent(post.content || "");
        const newFeatured = toWebpUrl(post.featured_image || "");

        const patch: Record<string, unknown> = {};
        if (newContent !== post.content) patch.content = newContent;
        if (newFeatured !== post.featured_image) patch.featured_image = newFeatured;
        if (Object.keys(patch).length === 0) return;

        await admin.from("posts").update(patch).eq("id", postId);
      } catch (e) {
        console.error("[optimize-post-images]", e);
      }
    })();

    // @ts-ignore
    if (typeof EdgeRuntime !== "undefined" && (EdgeRuntime as any).waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(bgTask);
    } else {
      bgTask.catch(() => {});
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
