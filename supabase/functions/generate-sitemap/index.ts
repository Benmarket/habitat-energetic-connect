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

    // Fetch all published posts WITH their categories for proper URL building
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

    // Fetch landing pages with SEO status
    const { data: landingPages, error: lpError } = await supabase
      .from("landing_pages")
      .select("path, updated_at, slug")
      .eq("seo_status", "seo");

    if (lpError) {
      console.error("Error fetching landing pages:", lpError);
    }

    // Fetch forum categories for forum URLs
    const { data: forumCategories, error: fcError } = await supabase
      .from("forum_categories")
      .select("slug, updated_at");

    if (fcError) {
      console.error("Error fetching forum categories:", fcError);
    }

    const baseUrl = "https://prime-energies.fr";
    const currentDate = new Date().toISOString();

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Homepage
    sitemap += `  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>\n`;

    // Static pages
    const staticPages = [
      { url: "/actualites", priority: "0.9", changefreq: "daily" },
      { url: "/guides", priority: "0.9", changefreq: "weekly" },
      { url: "/aides", priority: "0.9", changefreq: "weekly" },
      { url: "/faq", priority: "0.7", changefreq: "monthly" },
      { url: "/simulateurs/solaire", priority: "0.8", changefreq: "monthly" },
      { url: "/forum", priority: "0.7", changefreq: "daily" },
    ];

    staticPages.forEach((page) => {
      sitemap += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
    });

    // Dynamic content — CORRECT URLs matching actual routes
    posts?.forEach((post: any) => {
      let url = "";
      let priority = "0.7";
      let changefreq = "monthly";

      if (post.content_type === "actualite") {
        // Route: /actualites/:categorySlug/:slug
        const categorySlug = post.post_categories?.[0]?.categories?.slug || "non-classe";
        url = `${baseUrl}/actualites/${categorySlug}/${post.slug}`;
        priority = "0.8";
        changefreq = "weekly";
      } else if (post.content_type === "guide") {
        // Route: /guide/:slug (singular!)
        url = `${baseUrl}/guide/${post.slug}`;
        priority = "0.8";
        changefreq = "monthly";
      } else if (post.content_type === "aide") {
        // Route: /aide/:slug (singular!)
        url = `${baseUrl}/aide/${post.slug}`;
        priority = "0.7";
        changefreq = "monthly";
      } else {
        return; // skip unknown types
      }

      sitemap += `  <url>
    <loc>${url}</loc>
    <lastmod>${post.updated_at || post.published_at}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>\n`;
    });

    // Landing pages with SEO status
    landingPages?.forEach((lp: any) => {
      sitemap += `  <url>
    <loc>${baseUrl}${lp.path}</loc>
    <lastmod>${lp.updated_at || currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>\n`;
    });

    // Forum categories
    forumCategories?.forEach((fc: any) => {
      sitemap += `  <url>
    <loc>${baseUrl}/forum/categorie/${fc.slug}</loc>
    <lastmod>${fc.updated_at || currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>\n`;
    });

    sitemap += "</urlset>";

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
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
