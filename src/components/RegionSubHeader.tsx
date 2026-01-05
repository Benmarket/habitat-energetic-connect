import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

// Import region images
import franceImg from "@/assets/regions/france.png";
import corseImg from "@/assets/regions/corse.png";
import reunionImg from "@/assets/regions/reunion.png";
import martiniqueImg from "@/assets/regions/martinique.png";
import guadeloupeImg from "@/assets/regions/guadeloupe.png";
import guyaneImg from "@/assets/regions/guyane.png";

const regions = [
  { name: "France", image: franceImg },
  { name: "Corse", image: corseImg },
  { name: "Réunion", image: reunionImg },
  { name: "Martinique", image: martiniqueImg },
  { name: "Guadeloupe", image: guadeloupeImg },
  { name: "Guyane", image: guyaneImg },
];

interface RegionSubHeaderProps {
  isScrolled?: boolean;
}

const RegionSubHeader = ({ isScrolled = false }: RegionSubHeaderProps) => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
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

  const handleRegionClick = (regionName: string) => {
    setSelectedRegion(regionName);
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
            {regions.map((region) => (
              <button
                key={region.name}
                onClick={() => handleRegionClick(region.name)}
                className={`group flex flex-col items-center gap-1 flex-1 transition-all duration-200 hover:scale-110 focus:outline-none ${
                  selectedRegion === region.name ? "scale-105" : ""
                }`}
              >
                <div className="relative w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center">
                  <img
                    src={region.image}
                    alt={region.name}
                    className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-115"
                  />
                </div>
                <span className="text-[10px] md:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
                  {region.name}
                </span>
              </button>
            ))}
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
