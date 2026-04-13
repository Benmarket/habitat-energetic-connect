import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type RegionCode = "fr" | "corse" | "reunion" | "martinique" | "guadeloupe" | "guyane";

const VALID_REGIONS: RegionCode[] = ["fr", "corse", "reunion", "martinique", "guadeloupe", "guyane"];
const STORAGE_KEY = "prime-energies-region";

interface RegionContextType {
  activeRegion: RegionCode;
  setActiveRegion: (region: RegionCode) => void;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

function getInitialRegion(): RegionCode {
  // 1. Check query param
  if (typeof window !== "undefined") {
    if (window.location.pathname === "/") {
      const urlParams = new URLSearchParams(window.location.search);
      const regionParam = urlParams.get("region")?.toLowerCase() as RegionCode;
      if (regionParam && VALID_REGIONS.includes(regionParam)) {
        return regionParam;
      }
    }
    
    // 2. Check localStorage
    const storedRegion = localStorage.getItem(STORAGE_KEY) as RegionCode;
    if (storedRegion && VALID_REGIONS.includes(storedRegion)) {
      return storedRegion;
    }
  }
  
  // 3. Default to "fr"
  return "fr";
}

export function RegionProvider({ children }: { children: ReactNode }) {
  const [activeRegion, setActiveRegionState] = useState<RegionCode>(getInitialRegion);

  // On mount, sync initial region to URL if not already present
  useEffect(() => {
    if (window.location.pathname !== "/") return;

    const urlParams = new URLSearchParams(window.location.search);
    const currentRegion = urlParams.get("region");
    
    if (!currentRegion && activeRegion !== "fr") {
      // If region is from localStorage but not in URL, update URL
      urlParams.set("region", activeRegion);
      const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  const setActiveRegion = (region: RegionCode) => {
    if (!VALID_REGIONS.includes(region)) return;
    
    setActiveRegionState(region);
    
    // Store in localStorage
    localStorage.setItem(STORAGE_KEY, region);
    
    // Update URL only on homepage
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
