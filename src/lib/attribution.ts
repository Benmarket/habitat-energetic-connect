/**
 * Lead attribution helper — captures the visitor's traffic source
 * (referrer, UTM parameters, landing URL, detected channel) and returns
 * a compact object safe to persist alongside any submission.
 *
 * First-touch UTM/landing/referrer are persisted in sessionStorage so we
 * don't lose them when the user navigates before submitting the form.
 */

const ATTR_KEY = "lead_attribution_v1";

export type Attribution = {
  referrer_source: string;
  referrer_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  landing_url: string | null;
  current_url: string | null;
  gclid: string | null;
  fbclid: string | null;
};

function detectSource(referrer: string, utmSource?: string | null): string {
  const src = (utmSource || "").toLowerCase();
  if (src) {
    if (src.includes("facebook") || src === "fb" || src === "meta") return "facebook";
    if (src.includes("instagram") || src === "ig") return "instagram";
    if (src.includes("google")) return "google";
    if (src.includes("tiktok")) return "tiktok";
    if (src.includes("linkedin")) return "linkedin";
    if (src.includes("youtube")) return "youtube";
    if (src.includes("twitter") || src === "x") return "twitter";
    if (src.includes("bing")) return "bing";
    if (src.includes("newsletter") || src.includes("email")) return "email";
    return src;
  }
  const r = (referrer || "").toLowerCase();
  if (!r) return "direct";
  try {
    const host = new URL(r).hostname.replace(/^www\./, "");
    // AI
    if (host.includes("chat.openai") || host.includes("chatgpt.com")) return "chatgpt";
    if (host.includes("perplexity")) return "perplexity";
    if (host.includes("gemini.google") || host.includes("bard.google")) return "gemini";
    if (host.includes("claude.ai")) return "claude";
    if (host.includes("copilot.microsoft") || host.includes("bing.com/chat")) return "copilot";
    if (host.includes("you.com")) return "you";
    // Social
    if (host.includes("facebook") || host.includes("fb.com") || host.includes("m.facebook")) return "facebook";
    if (host.includes("instagram")) return "instagram";
    if (host.includes("tiktok")) return "tiktok";
    if (host.includes("linkedin") || host.includes("lnkd.in")) return "linkedin";
    if (host.includes("youtube") || host.includes("youtu.be")) return "youtube";
    if (host.includes("twitter") || host === "x.com" || host.endsWith(".x.com") || host.includes("t.co")) return "twitter";
    if (host.includes("pinterest")) return "pinterest";
    if (host.includes("reddit")) return "reddit";
    if (host.includes("snapchat")) return "snapchat";
    if (host.includes("threads")) return "threads";
    if (host.includes("whatsapp")) return "whatsapp";
    // Search
    if (host.includes("google.")) return "google";
    if (host.includes("bing.")) return "bing";
    if (host.includes("duckduckgo")) return "duckduckgo";
    if (host.includes("yahoo.")) return "yahoo";
    if (host.includes("qwant")) return "qwant";
    if (host.includes("ecosia")) return "ecosia";
    if (host.includes("brave.com") || host.includes("search.brave")) return "brave";
    if (host.includes("yandex")) return "yandex";
    if (host.includes("baidu")) return "baidu";
    // Internal
    if (typeof window !== "undefined" && host.includes(window.location.hostname.replace(/^www\./, ""))) return "internal";
    return host || "other";
  } catch {
    return "other";
  }
}

/**
 * Capture / refresh first-touch attribution. Safe to call on every page load.
 * If UTM params are present in the current URL, they overwrite the stored ones
 * (new campaign click = new attribution).
 */
export function captureAttribution(): Attribution {
  const fallback: Attribution = {
    referrer_source: "direct",
    referrer_url: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
    landing_url: null,
    current_url: null,
    gclid: null,
    fbclid: null,
  };
  if (typeof window === "undefined") return fallback;

  try {
    const params = new URLSearchParams(window.location.search);
    const utm_source = params.get("utm_source");
    const utm_medium = params.get("utm_medium");
    const utm_campaign = params.get("utm_campaign");
    const utm_content = params.get("utm_content");
    const utm_term = params.get("utm_term");
    const gclid = params.get("gclid");
    const fbclid = params.get("fbclid");
    const referrer_url = document.referrer || null;
    const hasNewCampaign = !!(utm_source || utm_medium || utm_campaign || gclid || fbclid);

    let stored: Attribution | null = null;
    try {
      const raw = sessionStorage.getItem(ATTR_KEY);
      if (raw) stored = JSON.parse(raw) as Attribution;
    } catch {
      /* noop */
    }

    if (!stored || hasNewCampaign) {
      const next: Attribution = {
        referrer_source: detectSource(referrer_url || "", utm_source),
        referrer_url,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        landing_url: window.location.href,
        current_url: window.location.href,
        gclid,
        fbclid,
      };
      try {
        sessionStorage.setItem(ATTR_KEY, JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    }

    // Refresh current URL only
    stored.current_url = window.location.href;
    return stored;
  } catch {
    return fallback;
  }
}

/** Return attribution suitable for spreading into an insert payload. */
export function getAttribution(): Attribution {
  return captureAttribution();
}
