import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRegionContext } from "@/hooks/useRegionContext";
import { useAuth } from "@/hooks/useAuth";

const VISITOR_KEY = "visitor_id";
const UTM_KEY = "attribution";
const CONSENT_KEY = "cookies_accepted";
const VISITOR_INFO_KEY = "visitor_info_v1";

// Backoffice / admin routes NEVER tracked — they pollute analytics.
const EXCLUDED_PREFIXES = [
  "/admin",
  "/administration",
  "/dashboard",
  "/gerer-",
  "/mon-compte",
  "/profil",
];
const shouldTrack = (path: string) =>
  !EXCLUDED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));

const hasConsent = (): boolean => {
  try {
    return localStorage.getItem(CONSENT_KEY) === "true";
  } catch {
    return false;
  }
};

const getVisitorId = (): string => {
  let visitorId = localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(VISITOR_KEY, visitorId);
  }
  return visitorId;
};

const detectDevice = (): string => {
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|blackberry|windows phone/i.test(ua)) return "mobile";
  return "desktop";
};

const detectBrowser = (): string => {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return "Safari";
  return "Autre";
};

type VisitorInfo = { ip: string | null; country: string | null };

const getVisitorInfo = async (): Promise<VisitorInfo> => {
  try {
    const cached = sessionStorage.getItem(VISITOR_INFO_KEY);
    if (cached) return JSON.parse(cached);
  } catch { /* noop */ }
  try {
    const { data } = await supabase.functions.invoke("visitor-info", { body: {} });
    const info = { ip: data?.ip ?? null, country: data?.country ?? null };
    try { sessionStorage.setItem(VISITOR_INFO_KEY, JSON.stringify(info)); } catch { /* noop */ }
    return info;
  } catch {
    return { ip: null, country: null };
  }
};

type Attribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

const captureAttribution = (search: string): Attribution => {
  const params = new URLSearchParams(search);
  const fromUrl: Attribution = {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
  };
  if (fromUrl.utm_source || fromUrl.utm_medium || fromUrl.utm_campaign) {
    try { sessionStorage.setItem(UTM_KEY, JSON.stringify(fromUrl)); } catch { /* noop */ }
    return fromUrl;
  }
  try {
    const stored = sessionStorage.getItem(UTM_KEY);
    if (stored) return JSON.parse(stored) as Attribution;
  } catch { /* noop */ }
  return { utm_source: null, utm_medium: null, utm_campaign: null };
};

export const usePageViewTracking = () => {
  const location = useLocation();
  const { activeRegion } = useRegionContext();
  const { user } = useAuth();
  const lastTrackedPath = useRef<string | null>(null);
  const pageViewIdRef = useRef<string | null>(null);
  const pageEntryTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // GDPR: only track when the user has accepted cookies
    if (!hasConsent()) return;

    const sendDuration = () => {
      const pvId = pageViewIdRef.current;
      if (!pvId) return;
      const duration = Math.round((Date.now() - pageEntryTimeRef.current) / 1000);
      if (duration < 2 || duration > 3600) return;

      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/page_views?id=eq.${pvId}`;
      const body = JSON.stringify({ duration_seconds: duration });
      const headers = {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        Prefer: "return=minimal",
      };

      fetch(url, { method: "PATCH", headers, body, keepalive: true }).catch(() => {});
      pageViewIdRef.current = null;
    };

    const trackPageView = async () => {
      const currentPath = location.pathname + location.search;
      if (lastTrackedPath.current === currentPath) return;

      sendDuration();
      lastTrackedPath.current = currentPath;
      pageEntryTimeRef.current = Date.now();

      try {
        const attribution = captureAttribution(location.search);
        const { data } = await supabase
          .from("page_views")
          .insert({
            page_url: location.pathname,
            region_code: activeRegion,
            user_id: user?.id || null,
            visitor_id: getVisitorId(),
            user_agent: navigator.userAgent,
            referrer: document.referrer || null,
            device_type: detectDevice(),
            utm_source: attribution.utm_source,
            utm_medium: attribution.utm_medium,
            utm_campaign: attribution.utm_campaign,
          })
          .select("id")
          .single();

        if (data) pageViewIdRef.current = data.id;
      } catch (error) {
        console.error("Error tracking page view:", error);
      }
    };

    trackPageView();

    const handleBeforeUnload = () => sendDuration();
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") sendDuration();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
      sendDuration();
    };
  }, [location.pathname, location.search, activeRegion, user?.id]);
};
