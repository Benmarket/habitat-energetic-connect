import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

interface SolarStickyCTAProps {
  onCtaClick: () => void;
}

const SolarStickyCTA = ({ onCtaClick }: SolarStickyCTAProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="bg-card/95 backdrop-blur-md border-t border-border px-4 py-3 flex items-center gap-3 shadow-2xl">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">Passez au solaire ☀️</p>
          <p className="text-xs text-muted-foreground truncate">Testez votre éligibilité en 1 min</p>
        </div>
        <button
          onClick={onCtaClick}
          className="bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-full text-sm shadow-lg hover:bg-primary/90 transition-all flex-shrink-0 flex items-center gap-1"
        >
          <ArrowUp className="w-4 h-4" />
          J'en profite
        </button>
      </div>
    </div>
  );
};

export default SolarStickyCTA;
