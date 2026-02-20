import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://habitat-energetic-connect.lovable.app",
  "https://prime-energies.fr",
  "https://www.prime-energies.fr",
  "https://id-preview--e3a30aac-ec15-471c-a0b8-85e6321675bf.lovable.app",
  "https://e3a30aac-ec15-471c-a0b8-85e6321675bf.lovableproject.com",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Vary": "Origin",
  };
}

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitStore = new Map<string, number>();
const RATE_LIMIT_INTERVAL_MS = 10000; // 10 seconds minimum between requests per IP

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
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract client IP for rate limiting
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({ error: "Trop de requêtes. Veuillez patienter." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all published posts
    const { data: posts, error } = await supabase
      .from("posts")
      .select("slug, content_type, updated_at, published_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    // Fetch landing pages with SEO status = 'seo' (exclude hidden and disabled)
    const { data: landingPages, error: lpError } = await supabase
      .from("landing_pages")
      .select("path, updated_at, slug")
      .eq("seo_status", "seo");

    if (lpError) {
      console.error("Error fetching landing pages:", lpError);
    }

    const baseUrl = "https://prime-energies.fr";
    const currentDate = new Date().toISOString();

    // Build sitemap XML
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
    ];

    staticPages.forEach((page) => {
      sitemap += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
    });

    // Dynamic content
    posts?.forEach((post) => {
      const contentPath =
        post.content_type === "actualite"
          ? "actualites"
          : post.content_type === "guide"
          ? "guides"
          : "aides";
      const priority = post.content_type === "actualite" ? "0.8" : "0.7";
      const changefreq =
        post.content_type === "actualite" ? "weekly" : "monthly";

      sitemap += `  <url>
    <loc>${baseUrl}/${contentPath}/${post.slug}</loc>
    <lastmod>${post.updated_at || post.published_at}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>\n`;
    });

    // Add landing pages with SEO status
    landingPages?.forEach((lp) => {
      sitemap += `  <url>
    <loc>${baseUrl}${lp.path}</loc>
    <lastmod>${lp.updated_at || currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>\n`;
    });

    sitemap += "</urlset>";

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
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