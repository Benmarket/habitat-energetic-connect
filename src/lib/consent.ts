/**
 * Consent helper — reads the cookie banner decision and returns a
 * compact payload safe to persist alongside every submission.
 *
 * Two sources of truth are read (banner writes to both):
 *  - real cookie `pe_cookie_consent` (survives across subdomains / long term)
 *  - localStorage `cookies_accepted` / `cookies_refused` (legacy)
 */

export type CookieConsentStatus = "accepted" | "refused" | "unknown";

export type ConsentPayload = {
  form_rgpd: boolean;
  cookies: CookieConsentStatus;
  cookies_at: string | null; // ISO when the visitor chose accept/refuse
  timestamp: string; // ISO of the submission
  version: string;
};

const CONSENT_VERSION = "1.0";
const COOKIE_NAME = "pe_cookie_consent";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function writeCookieConsent(status: "accepted" | "refused") {
  if (typeof document === "undefined") return;
  const payload = JSON.stringify({
    status,
    at: new Date().toISOString(),
    v: CONSENT_VERSION,
  });
  // 13 months per CNIL recommendation
  const maxAge = 60 * 60 * 24 * 395;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(payload)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function getCookieConsent(): { status: CookieConsentStatus; at: string | null } {
  // 1) Real cookie
  try {
    const raw = readCookie(COOKIE_NAME);
    if (raw) {
      const parsed = JSON.parse(raw) as { status?: string; at?: string };
      if (parsed?.status === "accepted" || parsed?.status === "refused") {
        return { status: parsed.status, at: parsed.at || null };
      }
    }
  } catch {
    /* noop */
  }
  // 2) Legacy localStorage
  try {
    if (typeof localStorage !== "undefined") {
      if (localStorage.getItem("cookies_accepted") === "true") {
        return { status: "accepted", at: null };
      }
      if (localStorage.getItem("cookies_refused") === "true") {
        return { status: "refused", at: null };
      }
    }
  } catch {
    /* noop */
  }
  return { status: "unknown", at: null };
}

/**
 * Build a consent payload for an insert. `formRgpd` is true when the
 * form's RGPD checkbox was ticked (or the form implies consent by submission).
 * Never blocks: cookie banner "unknown" is a valid value.
 */
export function getConsentPayload(formRgpd = true): ConsentPayload {
  const cookie = getCookieConsent();
  return {
    form_rgpd: !!formRgpd,
    cookies: cookie.status,
    cookies_at: cookie.at,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
}
