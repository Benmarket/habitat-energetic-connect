/**
 * Meta (Facebook) Pixel helper.
 *
 * Le Pixel ID est stocké dans site_settings (clé: meta_pixel_id).
 * Le script officiel fbevents.js est injecté une seule fois par le composant
 * <MetaPixel /> monté dans App.tsx, puis on utilise `window.fbq` pour envoyer
 * des événements standards.
 *
 * Événements utilisés :
 *  - PageView : à chaque changement de route (SPA)
 *  - Lead     : à chaque soumission de formulaire de conversion (simulateur, LP, contact)
 */

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    __META_PIXEL_ID__?: string | null;
    __META_PIXEL_LOADED__?: boolean;
  }
}

/** Injecte le script officiel fbevents.js et initialise le pixel. */
export function loadMetaPixel(pixelId: string) {
  if (typeof window === "undefined") return;
  if (!pixelId) return;
  // Déjà chargé (même pixel) : on ne réinjecte pas
  if (window.__META_PIXEL_LOADED__ && window.__META_PIXEL_ID__ === pixelId) return;

  // Bootstrap fbq (code officiel Meta, format compact)
  if (!window.fbq) {
    /* eslint-disable */
    (function (f: any, b: any, e: string, v: string) {
      if (f.fbq) return;
      const n: any = (f.fbq = function () {
        n.callMethod
          ? n.callMethod.apply(n, arguments)
          : n.queue.push(arguments);
      });
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      const t = b.createElement(e) as HTMLScriptElement;
      t.async = true;
      t.src = v;
      const s = b.getElementsByTagName(e)[0];
      s.parentNode?.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
  }

  window.__META_PIXEL_ID__ = pixelId;
  window.__META_PIXEL_LOADED__ = true;

  try {
    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
  } catch (e) {
    console.debug("[MetaPixel] init error", e);
  }
}

/** Track un PageView (à appeler sur changement de route SPA). */
export function trackMetaPageView() {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    window.fbq("track", "PageView");
  } catch (e) {
    console.debug("[MetaPixel] PageView error", e);
  }
}

type LeadParams = {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
};

/**
 * Track un événement Lead (conversion).
 * `content_name` = provenance (ex. "simulateur-solaire", "landing-solaire", "footer-contact").
 */
export function trackMetaLead(params: LeadParams = {}) {
  if (typeof window === "undefined" || !window.fbq) return;
  const payload: Record<string, any> = {
    currency: "EUR",
    ...params,
  };
  try {
    window.fbq("track", "Lead", payload);
  } catch (e) {
    console.debug("[MetaPixel] Lead error", e);
  }
}

/** Track n'importe quel événement standard/custom. */
export function trackMetaEvent(
  eventName: string,
  params: Record<string, any> = {},
  standard = true,
) {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    window.fbq(standard ? "track" : "trackCustom", eventName, params);
  } catch (e) {
    console.debug("[MetaPixel] event error", e);
  }
}
