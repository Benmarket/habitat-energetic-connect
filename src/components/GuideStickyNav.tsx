import { useState, useEffect } from "react";
import { Download, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface GuideStickyNavProps {
  guideTitle: string;
  template: string;
  toc: TOCItem[];
  isDownloadable: boolean;
  activeId?: string;
  onScrollToSection: (id: string) => void;
  guide?: { id: string; slug: string; title: string };
}

// Styles par template
const templateStyles: Record<string, {
  container: string;
  downloadButton: string;
  tocContainer: string;
  tocTitle: string;
  tocItemActive: string;
  tocItemInactive: string;
  tocNumberActive: string;
  tocNumberInactive: string;
}> = {
  classique: {
    container: "bg-white/95 backdrop-blur-sm border-slate-200 shadow-lg",
    downloadButton: "bg-primary hover:bg-primary/90 text-primary-foreground",
    tocContainer: "bg-white rounded-xl border border-slate-100",
    tocTitle: "text-slate-500",
    tocItemActive: "bg-blue-50 text-blue-700 font-medium",
    tocItemInactive: "text-slate-600 hover:bg-slate-50",
    tocNumberActive: "bg-blue-500 text-white",
    tocNumberInactive: "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
  },
  premium: {
    container: "bg-white/90 backdrop-blur-sm border-amber-200 shadow-xl",
    downloadButton: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25",
    tocContainer: "bg-white/80 rounded-xl border border-amber-100",
    tocTitle: "text-amber-700",
    tocItemActive: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 font-medium shadow-sm",
    tocItemInactive: "text-gray-600 hover:bg-amber-50",
    tocNumberActive: "bg-gradient-to-br from-amber-400 to-yellow-500 text-white",
    tocNumberInactive: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
  },
  expert: {
    container: "bg-slate-900/95 backdrop-blur-sm border-blue-500/30 shadow-xl",
    downloadButton: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25",
    tocContainer: "bg-slate-800/80 rounded-xl border border-slate-700",
    tocTitle: "text-blue-400",
    tocItemActive: "bg-blue-500/20 text-blue-300 font-medium",
    tocItemInactive: "text-slate-400 hover:bg-slate-700/50",
    tocNumberActive: "bg-blue-500 text-white",
    tocNumberInactive: "bg-slate-700 text-slate-400 group-hover:bg-slate-600",
  },
  epure: {
    container: "bg-white/95 backdrop-blur-sm border-zinc-200 shadow-lg",
    downloadButton: "bg-zinc-900 hover:bg-zinc-800 text-white",
    tocContainer: "bg-white rounded-xl border border-zinc-100",
    tocTitle: "text-zinc-500",
    tocItemActive: "bg-zinc-100 text-zinc-900 font-medium",
    tocItemInactive: "text-zinc-600 hover:bg-zinc-50",
    tocNumberActive: "bg-zinc-900 text-white",
    tocNumberInactive: "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200",
  },
  vibrant: {
    container: "bg-white/95 backdrop-blur-sm border-indigo-200 shadow-xl",
    downloadButton: "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/25",
    tocContainer: "bg-white/80 rounded-xl border border-indigo-100",
    tocTitle: "text-indigo-600",
    tocItemActive: "bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 font-medium",
    tocItemInactive: "text-gray-600 hover:bg-indigo-50",
    tocNumberActive: "bg-gradient-to-br from-indigo-500 to-purple-500 text-white",
    tocNumberInactive: "bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100",
  },
  sombre: {
    container: "bg-zinc-900/95 backdrop-blur-sm border-emerald-500/30 shadow-xl",
    downloadButton: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25",
    tocContainer: "bg-zinc-800/80 rounded-xl border border-zinc-700",
    tocTitle: "text-emerald-400",
    tocItemActive: "bg-emerald-500/20 text-emerald-300 font-medium",
    tocItemInactive: "text-zinc-400 hover:bg-zinc-700/50",
    tocNumberActive: "bg-emerald-500 text-white",
    tocNumberInactive: "bg-zinc-700 text-zinc-400 group-hover:bg-zinc-600",
  },
};

export function GuideStickyNav({ 
  guideTitle, 
  template, 
  toc, 
  isDownloadable, 
  activeId,
  onScrollToSection,
  guide,
}: GuideStickyNavProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDownload = async () => {
    if (user && guide) {
      // Membre connecté : log direct + impression PDF (rendu identique au web)
      await supabase.from("guide_downloads").insert({
        guide_id: guide.id,
        guide_slug: guide.slug,
        guide_title: guide.title,
        email: user.email || "",
        first_name: (user.user_metadata as any)?.first_name || null,
        last_name: (user.user_metadata as any)?.last_name || null,
        user_id: user.id,
        method: "direct",
      });
      window.print();
      return;
    }
    // Visiteur non-connecté : popup pour capter le lead, puis print
    window.dispatchEvent(new CustomEvent("trigger-popup", {
      detail: {
        triggerId: "guide-download",
        guideContext: guide ? {
          id: guide.id,
          slug: guide.slug,
          title: guide.title,
          triggerPrintAfterSubmit: true,
        } : undefined,
      },
    }));
  };

  const styles = templateStyles[template] || templateStyles.classique;
  
  // Ne pas afficher si pas de contenu
  if (!isDownloadable && toc.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed top-28 right-4 z-40 transition-all duration-500 hidden lg:block w-72 no-print",
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8 pointer-events-none"
      )}
    >
      <div className={cn("rounded-2xl border p-4 space-y-4", styles.container)}>
        {/* Bouton télécharger */}
        {isDownloadable && (
          <Button
            onClick={handleDownload}
            className={cn(
              "w-full gap-2 font-semibold py-3 rounded-xl",
              styles.downloadButton
            )}
          >
            <Download className="w-4 h-4" />
            Télécharger le guide
          </Button>
        )}

        {/* Sommaire */}
        {toc.length > 0 && (
          <div className={cn("p-4", styles.tocContainer)}>
            <div className={cn("flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-3", styles.tocTitle)}>
              <BookOpen className="w-4 h-4" />
              Sommaire
            </div>
            <nav className="space-y-1 max-h-[50vh] overflow-y-auto scrollbar-thin">
              {toc.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => onScrollToSection(item.id)}
                  className={cn(
                    "w-full text-left text-sm py-2 px-3 rounded-lg transition-all duration-200 flex items-center gap-2 group",
                    activeId === item.id ? styles.tocItemActive : styles.tocItemInactive
                  )}
                  style={{ paddingLeft: `${12 + (item.level - 2) * 12}px` }}
                >
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all flex-shrink-0",
                    activeId === item.id ? styles.tocNumberActive : styles.tocNumberInactive
                  )}>
                    {index + 1}
                  </span>
                  <span className="truncate text-xs">{item.text}</span>
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
