import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GuideDownloadButtonProps {
  guideTitle: string;
  template: string;
}

// Styles par template
const templateStyles: Record<string, {
  buttonClass: string;
  iconClass?: string;
}> = {
  classique: {
    buttonClass: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg",
  },
  premium: {
    buttonClass: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25",
  },
  expert: {
    buttonClass: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25",
  },
  epure: {
    buttonClass: "bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg",
  },
  vibrant: {
    buttonClass: "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/25",
  },
  sombre: {
    buttonClass: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25",
  },
};

export function GuideDownloadButton({ guideTitle, template }: GuideDownloadButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Afficher le bouton après 200px de scroll
      setIsVisible(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDownload = () => {
    // TODO: Implémenter le téléchargement PDF
    console.log("Télécharger le guide:", guideTitle);
  };

  const styles = templateStyles[template] || templateStyles.classique;

  return (
    <div
      className={cn(
        "fixed top-24 right-4 z-40 transition-all duration-300",
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"
      )}
    >
      <Button
        onClick={handleDownload}
        className={cn(
          "gap-2 font-semibold px-4 py-2 rounded-full",
          styles.buttonClass
        )}
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Télécharger le guide</span>
        <span className="sm:hidden">PDF</span>
      </Button>
    </div>
  );
}
