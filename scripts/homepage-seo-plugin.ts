import type { Plugin } from "vite";
import { resolveHomepageSeo, type HomepageSeo } from "../src/lib/homepage-seo";

const escapeAttribute = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Static head and React receive the same immutable publication snapshot. */
export function injectHomepageSeo(html: string, seo: HomepageSeo): string {
  html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "");
  html = html.replace(/<meta\b[^>]*>/gi, tag =>
    /(?:name|property)\s*=\s*["'](?:description|og:(?:title|description|site_name)|twitter:(?:title|description))["']/i.test(tag) ? "" : tag);
  html = html.replace(/<script\b[^>]*id=["']homepage-seo-snapshot["'][^>]*>[\s\S]*?<\/script>/gi, "");
  const owned = 'data-react-helmet="true"';
  const tags = [
    `<title ${owned}>${escapeAttribute(seo.title)}</title>`,
    `<meta ${owned} name="description" content="${escapeAttribute(seo.description)}" />`,
    ...[["og:title", seo.title], ["og:description", seo.description], ["og:site_name", seo.siteName]].map(([key, value]) => `<meta ${owned} property="${key}" content="${escapeAttribute(value)}" />`),
    ...[["twitter:title", seo.title], ["twitter:description", seo.description]].map(([key, value]) => `<meta ${owned} name="${key}" content="${escapeAttribute(value)}" />`),
    `<script id="homepage-seo-snapshot" type="application/json">${JSON.stringify(seo).replace(/</g, "\\u003c")}</script>`,
  ];
  // Existing canonical/social fallbacks belong to Helmet too, so route changes
  // replace rather than duplicate them. Unrelated head tags stay untouched.
  html = html.replace(/<(meta|link)\b[^>]*>/gi, tag => {
    const managed = /property=["']og:/i.test(tag) || /name=["']twitter:/i.test(tag) || /rel=["']canonical["']/i.test(tag);
    return managed && !tag.includes("data-react-helmet") ? tag.replace(/^<(meta|link)/i, `<$1 ${owned}`) : tag;
  });
  return html.replace(/<\/head>/i, `${tags.join("\n    ")}\n  </head>`);
}

export function homepageSeoPlugin(env: Record<string, string>): Plugin {
  let buildSnapshot: HomepageSeo | undefined;
  let isBuild = false;
  async function load(): Promise<HomepageSeo> {
    const url = env.VITE_SUPABASE_URL;
    const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) throw new Error("Homepage SEO: public settings connection is unavailable; refusing inconsistent metadata.");
    const response = await fetch(`${url}/rest/v1/site_settings?select=key,value&key=in.(site_title,site_description,meta_description)&is_public=eq.true`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Homepage SEO: settings could not be read (${response.status}); retry publication.`);
    const rows = await response.json();
    if (!Array.isArray(rows) || !rows.some(row => row.key === "meta_description" && typeof row.value === "string" && row.value.trim())) {
      throw new Error("Homepage SEO: saved meta description is unavailable; refusing to publish fallback copy.");
    }
    return resolveHomepageSeo(rows);
  }
  return {
    name: "homepage-seo-settings",
    configResolved(config) { isBuild = config.command === "build"; },
    transformIndexHtml: {
      order: "pre",
      async handler(html) {
        if (isBuild) buildSnapshot ??= await load();
        const seo = buildSnapshot ?? await load();
        return injectHomepageSeo(html, seo);
      },
    },
  };
}