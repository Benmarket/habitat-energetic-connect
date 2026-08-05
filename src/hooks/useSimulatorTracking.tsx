import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Tracking d'abandon pour les simulateurs.
 * - Crée une "session" (une tentative) dès le montage
 * - Enregistre chaque étape atteinte + complétion/abandon
 * - Détecte la source de trafic (Google, Facebook, IA, etc.)
 */

const STORAGE_KEY = "sim_track_key";

function detectSource(referrer: string, utmSource?: string | null): string {
  const src = (utmSource || "").toLowerCase();
  if (src) {
    if (src.includes("facebook") || src === "fb") return "facebook";
    if (src.includes("instagram") || src === "ig") return "instagram";
    if (src.includes("google")) return "google";
    if (src.includes("tiktok")) return "tiktok";
    if (src.includes("linkedin")) return "linkedin";
    if (src.includes("youtube")) return "youtube";
    if (src.includes("twitter") || src === "x") return "twitter";
    if (src.includes("bing")) return "bing";
    if (src.includes("newsletter") || src.includes("email")) return "email";
  }
  const r = (referrer || "").toLowerCase();
  if (!r) return "direct";
  try {
    const host = new URL(r).hostname.replace(/^www\./, "");
    // IA
    if (host.includes("chat.openai") || host.includes("chatgpt.com")) return "chatgpt";
    if (host.includes("perplexity.ai")) return "perplexity";
    if (host.includes("gemini.google") || host.includes("bard.google")) return "gemini";
    if (host.includes("claude.ai")) return "claude";
    if (host.includes("copilot.microsoft") || host.includes("bing.com/chat")) return "copilot";
    if (host.includes("you.com")) return "you";
    // Social
    if (host.includes("facebook") || host.includes("fb.com")) return "facebook";
    if (host.includes("instagram")) return "instagram";
    if (host.includes("tiktok")) return "tiktok";
    if (host.includes("linkedin")) return "linkedin";
    if (host.includes("youtube")) return "youtube";
    if (host.includes("twitter") || host === "x.com" || host.endsWith(".x.com")) return "twitter";
    if (host.includes("pinterest")) return "pinterest";
    if (host.includes("reddit")) return "reddit";
    if (host.includes("snapchat")) return "snapchat";
    if (host.includes("threads")) return "threads";
    // Search engines
    if (host.includes("google.")) return "google";
    if (host.includes("bing.")) return "bing";
    if (host.includes("duckduckgo")) return "duckduckgo";
    if (host.includes("yahoo.")) return "yahoo";
    if (host.includes("qwant")) return "qwant";
    if (host.includes("ecosia")) return "ecosia";
    if (host.includes("brave.com") || host.includes("search.brave")) return "brave";
    if (host.includes("yandex")) return "yandex";
    if (host.includes("baidu")) return "baidu";
    // Own domain -> internal
    if (typeof window !== "undefined" && host.includes(window.location.hostname.replace(/^www\./, ""))) return "internal";
    return "other";
  } catch {
    return "other";
  }
}

function computeFingerprint(): string {
  try {
    const parts = [
      navigator.userAgent,
      navigator.language,
      `${screen.width}x${screen.height}`,
      `${screen.colorDepth}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.hardwareConcurrency || "",
      (navigator as any).deviceMemory || "",
    ].join("|");
    // simple hash
    let h = 0;
    for (let i = 0; i < parts.length; i++) {
      h = (h << 5) - h + parts.charCodeAt(i);
      h |= 0;
    }
    return `fp_${Math.abs(h).toString(36)}`;
  } catch {
    return "fp_unknown";
  }
}

function getOrCreateSessionKey(): string {
  try {
    let k = localStorage.getItem(STORAGE_KEY);
    if (!k) {
      k = `sk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(STORAGE_KEY, k);
    }
    return k;
  } catch {
    return `sk_${Math.random().toString(36).slice(2)}`;
  }
}

function parseUtm(): Record<string, string | null> {
  try {
    const u = new URL(window.location.href);
    return {
      utm_source: u.searchParams.get("utm_source"),
      utm_medium: u.searchParams.get("utm_medium"),
      utm_campaign: u.searchParams.get("utm_campaign"),
    };
  } catch {
    return { utm_source: null, utm_medium: null, utm_campaign: null };
  }
}

interface UseSimulatorTrackingOptions {
  simulatorId: string;
  totalSteps: number;
  stepLabels?: string[];
}

export function useSimulatorTracking({ simulatorId, totalSteps, stepLabels = [] }: UseSimulatorTrackingOptions) {
  const { user } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const maxStepRef = useRef<number>(0);
  const completedRef = useRef<boolean>(false);
  const startedRef = useRef<boolean>(false);

  const call = useCallback(async (payload: Record<string, unknown>) => {
    try {
      const { data, error } = await supabase.functions.invoke("track-simulator", {
        body: { simulator_id: simulatorId, ...payload },
      });
      if (error) {
        console.warn("[tracking] call failed", error);
        return null;
      }
      return data as { session_id?: string } | null;
    } catch (e) {
      console.warn("[tracking] call error", e);
      return null;
    }
  }, [simulatorId]);

  // Init session
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const init = async () => {
      const session_key = getOrCreateSessionKey();
      const referrer_url = document.referrer || null;
      const utm = parseUtm();
      const data = await call({
        action: "start",
        session_key,
        fingerprint: computeFingerprint(),
        referrer_url,
        referrer_source: detectSource(referrer_url || "", utm.utm_source),
        landing_url: window.location.href,
        total_steps: totalSteps,
        ...utm,
      });
      if (data?.session_id) sessionIdRef.current = data.session_id;
    };

    init().catch((e) => console.warn("[tracking] init error", e));

    // Beforeunload = abandon si pas complété
    const onUnload = () => {
      if (!sessionIdRef.current || completedRef.current) return;
      try {
        const body = JSON.stringify({
          action: "abandon",
          simulator_id: simulatorId,
          session_id: sessionIdRef.current,
          step: maxStepRef.current,
          step_label: stepLabels[maxStepRef.current - 1] || null,
        });
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-simulator`,
          new Blob([body], { type: "application/json" })
        );
      } catch {}
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulatorId]);

  const trackStep = useCallback(
    async (step: number) => {
      if (!sessionIdRef.current || step <= 0) return;
      if (step > maxStepRef.current) maxStepRef.current = step;
      await call({
        action: "step",
        session_id: sessionIdRef.current,
        step,
        step_label: stepLabels[step - 1] || null,
      });
    },
    [call, stepLabels]
  );

  const trackComplete = useCallback(async () => {
    if (!sessionIdRef.current) return;
    completedRef.current = true;
    await call({ action: "complete", session_id: sessionIdRef.current, total_steps: totalSteps });
  }, [call, totalSteps]);

  const trackLead = useCallback(
    async (email: string) => {
      if (!sessionIdRef.current) return;
      await call({ action: "lead", session_id: sessionIdRef.current, email });
    },
    [call]
  );

  return { trackStep, trackComplete, trackLead };
}

