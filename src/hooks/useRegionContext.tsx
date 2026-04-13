import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

export type RegionCode = "fr" | "corse" | "reunion" | "martinique" | "guadeloupe" | "guyane";

const VALID_REGIONS: RegionCode[] = ["fr", "corse", "reunion", "martinique", "guadeloupe", "guyane"];
const STORAGE_KEY = "prime-energies-region";

const isValidRegion = (value: string | null | undefined): value is RegionCode => {
  return Boolean(value && VALID_REGIONS.includes(value as RegionCode));
};

const isRegionActivePath = (pathname: string) => pathname === "/" || pathname.startsWith("/offres/");

function getStoredRegion(): RegionCode {
  if (typeof window === "undefined") return "fr";

  const storedRegion = localStorage.getItem(STORAGE_KEY)?.toLowerCase();
  return isValidRegion(storedRegion) ? storedRegion : "fr";
}

function getHomepageRegion(search: string): RegionCode {
  const regionParam = new URLSearchParams(search).get("region")?.toLowerCase();
  return isValidRegion(regionParam) ? regionParam : getStoredRegion();
}

interface RegionContextType {
  activeRegion: RegionCode;
  setActiveRegion: (region: RegionCode) => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

function getInitialRegion(): RegionCode {
  if (typeof window !== "undefined") {
    if (isRegionActivePath(window.location.pathname)) {
      return getHomepageRegion(window.location.search);
    }

    return getStoredRegion();
  }

  return "fr";
}

export function RegionProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isRegionActive = isRegionActivePath(location.pathname);
  const [selectedRegion, setSelectedRegionState] = useState<RegionCode>(getInitialRegion);

  useEffect(() => {
    const storedRegion = getStoredRegion();

    if (!isHomepage) {
      setSelectedRegionState((currentRegion) => (currentRegion === storedRegion ? currentRegion : storedRegion));
      return;
    }

    const urlParams = new URLSearchParams(location.search);
    const regionParam = urlParams.get("region")?.toLowerCase();
    const nextRegion = isValidRegion(regionParam) ? regionParam : storedRegion;

    setSelectedRegionState((currentRegion) => (currentRegion === nextRegion ? currentRegion : nextRegion));

    if (nextRegion === "fr") {
      if (urlParams.has("region")) {
        urlParams.delete("region");
        const queryString = urlParams.toString();
        const newUrl = queryString ? `${location.pathname}?${queryString}` : location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
      return;
    }

    if (regionParam !== nextRegion) {
      urlParams.set("region", nextRegion);
      window.history.replaceState({}, "", `${location.pathname}?${urlParams.toString()}`);
    }
  }, [isHomepage, location.pathname, location.search]);

  const setActiveRegion = (region: RegionCode) => {
    if (!VALID_REGIONS.includes(region)) return;

    setSelectedRegionState(region);
    localStorage.setItem(STORAGE_KEY, region);

    if (window.location.pathname === "/") {
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

  const activeRegion: RegionCode = isHomepage ? selectedRegion : "fr";

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
  "martinique": "Martinique",
  "guadeloupe": "Guadeloupe",
  "guyane": "Guyane",
};
