import { useState, useEffect } from "react";
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Auto-collapse on scroll
  useEffect(() => {
    if (isScrolled && !isCollapsed) {
      setIsCollapsed(true);
    }
  }, [isScrolled]);

  const handleRegionClick = (regionName: string) => {
    setSelectedRegion(regionName);
    // Pour le moment, pas de redirection
  };

  return (
    <div className="bg-muted/50 border-t border-border/50">
      {/* Toggle button - always visible */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? "max-h-0" : "max-h-24"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 md:gap-8 lg:gap-12 py-2 md:py-3">
            {regions.map((region) => (
              <button
                key={region.name}
                onClick={() => handleRegionClick(region.name)}
                className={`group flex flex-col items-center gap-1 transition-all duration-200 hover:scale-110 focus:outline-none ${
                  selectedRegion === region.name ? "scale-105" : ""
                }`}
              >
                <div className="relative w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 flex items-center justify-center">
                  <img
                    src={region.image}
                    alt={region.name}
                    className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-110"
                  />
                </div>
                <span className="text-[10px] md:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">
                  {region.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Collapse/Expand toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
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
