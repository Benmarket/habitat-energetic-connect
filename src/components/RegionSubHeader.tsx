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
  onHeightChange?: (height: number) => void;
}

const RegionSubHeader = ({ isScrolled = false, onHeightChange }: RegionSubHeaderProps) => {
  const [isManuallyCollapsed, setIsManuallyCollapsed] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Auto-collapse on scroll, auto-expand when back to top
  const isCollapsed = isScrolled ? true : isManuallyCollapsed;

  // Notify parent of height changes
  useEffect(() => {
    // Collapsed = only toggle button (~24px), expanded = full height (~120px)
    const height = isCollapsed ? 24 : 120;
    onHeightChange?.(height);
  }, [isCollapsed, onHeightChange]);

  const handleRegionClick = (regionName: string) => {
    setSelectedRegion(regionName);
    // Pour le moment, pas de redirection
  };

  return (
    <div className="bg-zinc-600 border-t border-zinc-500">
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? "max-h-0" : "max-h-32"
        }`}
      >
        <div className="container mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex items-center justify-between pt-4 pb-3 md:pt-5 md:pb-4">
            {regions.map((region) => (
              <button
                key={region.name}
                onClick={() => handleRegionClick(region.name)}
                className={`group flex flex-col items-center gap-1.5 flex-1 transition-all duration-200 hover:scale-110 focus:outline-none ${
                  selectedRegion === region.name ? "scale-105" : ""
                }`}
              >
                <div className="relative w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex items-center justify-center">
                  <img
                    src={region.image}
                    alt={region.name}
                    className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-115"
                  />
                </div>
                <span className="text-xs md:text-sm font-medium text-zinc-300 group-hover:text-white transition-colors whitespace-nowrap">
                  {region.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Collapse/Expand toggle */}
      <button
        onClick={() => setIsManuallyCollapsed(!isManuallyCollapsed)}
        className="w-full flex items-center justify-center py-1 hover:bg-zinc-600 transition-colors group"
        aria-label={isCollapsed ? "Afficher les régions" : "Masquer les régions"}
      >
        {isCollapsed ? (
          <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
        ) : (
          <ChevronUp className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
        )}
      </button>
    </div>
  );
};

export default RegionSubHeader;
