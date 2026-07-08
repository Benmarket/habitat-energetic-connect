import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteMode = "frh" | "prime";

const STORAGE_KEY = "site_mode";
const EVENT = "site-mode-changed";

function readCache(): SiteMode {
  if (typeof window === "undefined") return "frh";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "prime" ? "prime" : "frh";
}

export function useSiteMode(): { mode: SiteMode; loading: boolean } {
  const [mode, setMode] = useState<SiteMode>(readCache);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "site_mode")
        .maybeSingle();
      if (cancelled) return;
      const raw = (data?.value ?? null) as unknown;
      const next: SiteMode = raw === "prime" ? "prime" : "frh";
      setMode(next);
      window.localStorage.setItem(STORAGE_KEY, next);
      setLoading(false);
    })();

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<SiteMode>).detail;
      if (detail === "frh" || detail === "prime") setMode(detail);
    };
    window.addEventListener(EVENT, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT, onChange);
    };
  }, []);

  return { mode, loading };
}

export async function saveSiteMode(next: SiteMode, userId?: string): Promise<void> {
  const payload: { key: string; value: SiteMode; updated_by?: string } = {
    key: "site_mode",
    value: next,
  };
  if (userId) payload.updated_by = userId;
  const { error } = await supabase
    .from("site_settings")
    .upsert(payload, { onConflict: "key" });
  if (error) throw error;
  window.localStorage.setItem(STORAGE_KEY, next);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
}
