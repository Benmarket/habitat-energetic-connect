import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitStore = new Map<string, number>();
const RATE_LIMIT_INTERVAL_MS = 10000;

function checkRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const lastRequest = rateLimitStore.get(clientIP);
  if (lastRequest && now - lastRequest < RATE_LIMIT_INTERVAL_MS) {
    return false;
  }
  rateLimitStore.set(clientIP, now);
  return true;
}

const BASE_URL = "https://prime-energies.fr";

// Doit rester aligné avec scripts/generate-sitemap.ts
const STATIC_PAGES = [
  { url: "/", priority: "1.0", changefreq: "daily" },
  { url: "/actualites", priority: "0.9", changefreq: "daily" },
  { url: "/guides", priority: "0.9", changefreq: "weekly" },
  { url: "/aides", priority: "0.9", changefreq: "weekly" },
  { url: "/faq", priority: "0.7", changefreq: "monthly" },
  { url: "/simulateurs/solaire", priority: "0.8", changefreq: "monthly" },
  { url: "/services/installation-solaire", priority: "0.8", changefreq: "monthly" },
  { url: "/services/pompes-a-chaleur", priority: "0.8", changefreq: "monthly" },
  { url: "/services/stockage-energie", priority: "0.8", changefreq: "monthly" },
  { url: "/services/audit-energetique", priority: "0.8", changefreq: "monthly" },
  { url: "/services/amelioration-habitat", priority: "0.8", changefreq: "monthly" },
  { url: "/devenir-partenaire", priority: "0.6", changefreq: "monthly" },
  { url: "/forum", priority: "0.7", changefreq: "daily" },
  { url: "/plan-du-site", priority: "0.5", changefreq: "monthly" },
  { url: "/mentions-legales", priority: "0.3", changefreq: "monthly" },
  { url: "/politique-confidentialite", priority: "0.3", changefreq: "monthly" },
  { url: "/conditions-utilisation", priority: "0.3", changefreq: "monthly" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("cf-connecting-ip") ||
                     req.headers.get("x-real-ip") ||
                     "unknown";

    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({ error: "Trop de requêtes. Veuillez patienter." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Articles publiés + leur catégorie (nécessaire à l'URL des actualités)
    const { data: posts, error } = await supabase
      .from("posts")
      .select(`
        slug, content_type, updated_at, published_at,
        post_categories(
          categories(slug)
        )
      `)
      .eq("status", "published")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const { data: landingPages, error: lpError } = await supabase
      .from("landing_pages")
      .select("path, updated_at, slug")
      .eq("seo_status", "seo");

    if (lpError) console.error("Error fetching landing pages:", lpError);

    const { data: forumCategories, error: fcError } = await supabase
      .from("forum_categories")
      .select("slug, updated_at");

    if (fcError) console.error("Error fetching forum categories:", fcError);

    const seen = new Set<string>();
    const urls: string[] = [];

    const push = (path: string, opts: { lastmod?: string | null; changefreq?: string; priority?: string }) => {
      if (!path || seen.has(path)) return;
      seen.add(path);
      urls.push(
        [
          `  <url>`,
          `    <loc>${BASE_URL}${path}</loc>`,
          opts.lastmod ? `    <lastmod>${opts.lastmod}</lastmod>` : null,
          opts.changefreq ? `    <changefreq>${opts.changefreq}</changefreq>` : null,
          opts.priority ? `    <priority>${opts.priority}</priority>` : null,
          `  </url>`,
        ].filter(Boolean).join("\n"),
      );
    };

    STATIC_PAGES.forEach((p) => push(p.url, { changefreq: p.changefreq, priority: p.priority }));

    posts?.forEach((post: any) => {
      const lastmod = post.updated_at || post.published_at || null;
      if (post.content_type === "actualite") {
        const categorySlug = post.post_categories?.[0]?.categories?.slug || "non-classe";
        push(`/actualites/${categorySlug}/${post.slug}`, { lastmod, changefreq: "weekly", priority: "0.8" });
      } else if (post.content_type === "guide") {
        push(`/guide/${post.slug}`, { lastmod, changefreq: "monthly", priority: "0.8" });
      } else if (post.content_type === "aide") {
        push(`/aide/${post.slug}`, { lastmod, changefreq: "monthly", priority: "0.7" });
      }
    });

    landingPages?.forEach((lp: any) => {
      push(lp.path, { lastmod: lp.updated_at, changefreq: "weekly", priority: "0.9" });
    });

    forumCategories?.forEach((fc: any) => {
      push(`/forum/categorie/${fc.slug}`, { lastmod: fc.updated_at, changefreq: "daily", priority: "0.6" });
    });

    const sitemap = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      ...urls,
      `</urlset>`,
      ``,
    ].join("\n");

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=600, s-maxage=600",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
