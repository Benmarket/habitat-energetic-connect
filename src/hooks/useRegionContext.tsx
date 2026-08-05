import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export type RegionCode = "fr" | "corse" | "reunion" | "martinique" | "guadeloupe" | "guyane";

const VALID_REGIONS: RegionCode[] = ["fr", "corse", "reunion", "martinique", "guadeloupe", "guyane"];
const STORAGE_KEY = "prime-energies-region";
const STORAGE_TS_KEY = "prime-energies-region-ts";
const LEGACY_STORAGE_KEY = "prime-energies-region";
/** Durée d'inactivité au bout de laquelle le contexte région est vidé (30 min) */
const INACTIVITY_MS = 30 * 60 * 1000;

/** Mapping pays (ISO-2) -> région. La Corse n'est pas détectable (code FR). */
const COUNTRY_TO_REGION: Record<string, RegionCode> = {
  RE: "reunion",
  YT: "reunion",
  MQ: "martinique",
  GP: "guadeloupe",
  GF: "guyane",
};

const isValidRegion = (value: string | null | undefined): value is RegionCode => {
  return Boolean(value && VALID_REGIONS.includes(value as RegionCode));
};

const isRegionActivePath = (pathname: string) => pathname === "/" || pathname.startsWith("/offre-partenaire/");

/** Lit la région de session, en la purgeant si trop ancienne (inactivité). */
function getStoredRegion(): RegionCode | null {
  if (typeof window === "undefined") return null;

  try {
    // Purge d'un éventuel ancien stockage persistant (localStorage)
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* noop */
  }

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)?.toLowerCase();
    if (!isValidRegion(stored)) return null;

    const ts = Number(sessionStorage.getItem(STORAGE_TS_KEY) || 0);
    if (!ts || Date.now() - ts > INACTIVITY_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_TS_KEY);
      return null;
    }

    return stored;
  } catch {
    return null;
  }
}

function storeRegion(region: RegionCode) {
  try {
    sessionStorage.setItem(STORAGE_KEY, region);
    sessionStorage.setItem(STORAGE_TS_KEY, String(Date.now()));
  } catch {
    /* noop */
  }
}

function touchRegion() {
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) {
      sessionStorage.setItem(STORAGE_TS_KEY, String(Date.now()));
    }
  } catch {
    /* noop */
  }
}

interface RegionContextType {
  activeRegion: RegionCode;
  setActiveRegion: (region: RegionCode) => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

function getInitialRegion(): RegionCode {
  if (typeof window === "undefined") return "fr";

  if (isRegionActivePath(window.location.pathname)) {
    const regionParam = new URLSearchParams(window.location.search).get("region")?.toLowerCase();
    if (isValidRegion(regionParam)) return regionParam;
  }

  return getStoredRegion() ?? "fr";
}

export function RegionProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isRegionActive = isRegionActivePath(location.pathname);
  const [selectedRegion, setSelectedRegionState] = useState<RegionCode>(getInitialRegion);
  /** true dès que l'utilisateur a explicitement choisi une région (clic ou URL) */
  const userChoiceRef = useRef<boolean>(Boolean(getStoredRegion()));

  // Détection géographique automatique (uniquement si aucun choix explicite)
  useEffect(() => {
    let cancelled = false;

    const detect = async () => {
      if (userChoiceRef.current) return;

      try {
        const { data } = await supabase.functions.invoke("visitor-info");
        const country = (data as { country?: string } | null)?.country?.toUpperCase();
        const detected = country ? COUNTRY_TO_REGION[country] : undefined;

        if (cancelled || !detected) return;
        if (userChoiceRef.current) return;

        setSelectedRegionState(detected);
      } catch {
        /* silencieux : on reste sur "fr" */
      }
    };

    detect();
    return () => {
      cancelled = true;
    };
  }, []);

  // Purge automatique après inactivité prolongée
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (!userChoiceRef.current) return;
      if (getStoredRegion() === null) {
        userChoiceRef.current = false;
        setSelectedRegionState("fr");
      }
    }, 60 * 1000);

    const onActivity = () => touchRegion();
    window.addEventListener("click", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("scroll", onActivity, { passive: true });

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("click", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("scroll", onActivity);
    };
  }, []);

  // Synchronisation URL <-> région (l'URL fait toujours foi)
  useEffect(() => {
    if (!isRegionActive) return;

    const urlParams = new URLSearchParams(location.search);
    const regionParam = urlParams.get("region")?.toLowerCase();

    if (isValidRegion(regionParam)) {
      userChoiceRef.current = true;
      storeRegion(regionParam);
      setSelectedRegionState((current) => (current === regionParam ? current : regionParam));
      return;
    }

    if (urlParams.has("region")) {
      urlParams.delete("region");
      const queryString = urlParams.toString();
      window.history.replaceState({}, "", queryString ? `${location.pathname}?${queryString}` : location.pathname);
    }
  }, [isRegionActive, location.pathname, location.search]);

  const setActiveRegion = (region: RegionCode) => {
    if (!VALID_REGIONS.includes(region)) return;

    userChoiceRef.current = true;
    setSelectedRegionState(region);
    storeRegion(region);

    if (isRegionActivePath(window.location.pathname)) {
      const urlParams = new URLSearchParams(window.location.search);

      if (region === "fr") {
        urlParams.delete("region");
      } else {
        urlParams.set("region", region);
      }

      const queryString = urlParams.toString();
      const newUrl = queryString
        ? `${window.location.pathname}?${queryString}`
        : window.location.pathname;

      window.history.pushState({}, "", newUrl);
    }
  };

  const activeRegion: RegionCode = isRegionActive ? selectedRegion : "fr";

  return (
    <RegionContext.Provider value={{ activeRegion, setActiveRegion }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegionContext() {
  const context = useContext(RegionContext);
  if (context === undefined) {
    throw new Error("useRegionContext must be used within a RegionProvider");
  }
  return context;
}

// Helper to convert display name to code
export const regionNameToCode: Record<string, RegionCode> = {
  "France": "fr",
  "Corse": "corse",
  "Réunion": "reunion",
  "Martinique": "martinique",
  "Guadeloupe": "guadeloupe",
  "Guyane": "guyane",
};

// Helper to convert code to display name
export const regionCodeToName: Record<RegionCode, string> = {
  "fr": "France",
  "corse": "Corse",
  "reunion": "Réunion",
  "martinique": "martinique" as RegionCode extends never ? never : string,
  "guadeloupe": "Guadeloupe",
  "guyane": "Guyane",
} as Record<RegionCode, string>;
