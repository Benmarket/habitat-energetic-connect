import { useEffect, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useRegionContext, regionNameToCode, RegionCode } from "@/hooks/useRegionContext";

// Import region images
import franceImg from "@/assets/regions/france.png";
import corseImg from "@/assets/regions/corse.png";
import reunionImg from "@/assets/regions/reunion.png";
import martiniqueImg from "@/assets/regions/martinique.png";
import guadeloupeImg from "@/assets/regions/guadeloupe.png";
import guyaneImg from "@/assets/regions/guyane.png";
import { useState } from "react";

interface RegionData {
  name: string;
  code: RegionCode;
  image: string;
}

const regions: RegionData[] = [
  { name: "France", code: "fr", image: franceImg },
  { name: "Corse", code: "corse", image: corseImg },
  { name: "Réunion", code: "reunion", image: reunionImg },
  { name: "Martinique", code: "martinique", image: martiniqueImg },
  { name: "Guadeloupe", code: "guadeloupe", image: guadeloupeImg },
  { name: "Guyane", code: "guyane", image: guyaneImg },
];

interface RegionSubHeaderProps {
  isScrolled?: boolean;
}

const RegionSubHeader = ({ isScrolled = false }: RegionSubHeaderProps) => {
  const { activeRegion, setActiveRegion } = useRegionContext();
  // Manual override: null = follow auto, true = force closed, false = force open
  const [manualOverride, setManualOverride] = useState<boolean | null>(null);
  const prevIsScrolled = useRef(isScrolled);

  // When returning to top (isScrolled becomes false), reset manual override
  useEffect(() => {
    if (prevIsScrolled.current && !isScrolled) {
      // Just scrolled back to top -> reset override so it auto-opens
      setManualOverride(null);
    }
    prevIsScrolled.current = isScrolled;
  }, [isScrolled]);

  // Determine collapsed state
  const isCollapsed = manualOverride !== null ? manualOverride : isScrolled;

  const handleRegionClick = (regionCode: RegionCode) => {
    setActiveRegion(regionCode);
  };

  const handleToggle = () => {
    // Toggle manual override
    setManualOverride(prev => {
      if (prev === null) {
        // Currently following auto state, toggle opposite
        return !isScrolled;
      }
      // Toggle the override
      return !prev;
    });
  };

  return (
    <div className="bg-muted border-t border-border/50">
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? "max-h-0" : "max-h-32"
        }`}
      >
        <div className="container mx-auto px-1 md:px-8 lg:px-12">
          <div className="flex items-center justify-between pt-4 pb-3 md:pt-5 md:pb-4 gap-0.5 md:gap-2">
            {regions.map((region) => {
              const isActive = activeRegion === region.code;
              
              return (
                <button
                  key={region.code}
                  onClick={() => handleRegionClick(region.code)}
                  className={`group flex flex-col items-center gap-1.5 flex-1 focus:outline-none cursor-pointer transition-opacity duration-200 ${
                    isActive 
                      ? "" 
                      : "opacity-[0.72] hover:opacity-100"
                  }`}
                  aria-pressed={isActive}
                  aria-label={`Sélectionner la région ${region.name}`}
                >
                  {/* Image container with tight aura for active state */}
                  <div 
                    className={`relative w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-lg ${
                      isActive 
                        ? "shadow-[0_0_0_2px_hsl(var(--primary)/0.25),0_2px_8px_-2px_hsl(var(--primary)/0.35)]" 
                        : ""
                    }`}
                  >
                    <img
                      src={region.image}
                      alt={region.name}
                      className={`w-full h-full object-contain ${
                        isActive 
                          ? "contrast-[1.05]" 
                          : "grayscale-[0.15] group-hover:grayscale-0"
                      }`}
                    />
                  </div>
                  
                  {/* Region name with clear hierarchy */}
                  <span 
                    className={`text-[10px] md:text-sm whitespace-nowrap pb-0.5 ${
                      isActive 
                        ? "font-bold text-foreground tracking-tight" 
                        : "font-medium text-muted-foreground/80 group-hover:text-foreground"
                    }`}
                  >
                    {region.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Toggle button - always visible */}
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-center py-1 hover:bg-muted/70 transition-colors group"
        aria-label={isCollapsed ? "Afficher les régions" : "Masquer les régions"}
      >
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </button>
    </div>
  );
};

export default RegionSubHeader;
