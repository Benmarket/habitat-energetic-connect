import { X, Mail, Sparkles, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type PopupData = {
  template: string;
  title: string | null;
  subtitle: string | null;
  background_image: string | null;
  background_color: string;
  text_color: string;
  accent_color: string;
  overlay_opacity: number;
  size: string;
  position: string;
  animation: string;
  badge_text: string | null;
  badge_color: string;
  show_close_button: boolean;
  close_button_style: string;
};

interface PopupPreviewProps {
  popup: PopupData;
  onClose?: () => void;
}

export default function PopupPreview({ popup, onClose }: PopupPreviewProps) {
  const getSizeClasses = () => {
    switch (popup.size) {
      case "small":
        return "max-w-sm";
      case "medium":
        return "max-w-md";
      case "large":
        return "max-w-2xl";
      case "fullscreen":
        return "w-full h-full max-w-none rounded-none";
      default:
        return "max-w-md";
    }
  };
  
  // Force large size for parcours_projet template
  const effectiveSize = popup.template === "parcours_projet" ? "large" : popup.size;

  const getPositionClasses = () => {
    if (popup.size === "fullscreen") return "inset-0";
    
    switch (popup.position) {
      case "center":
        return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "top-left":
        return "top-4 left-4";
      default:
        return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
    }
  };

  const getAnimationClasses = () => {
    switch (popup.animation) {
      case "fade":
        return "animate-fade-in";
      case "slide-up":
        return "animate-[slideUp_0.3s_ease-out]";
      case "slide-down":
        return "animate-[slideDown_0.3s_ease-out]";
      case "scale":
        return "animate-scale-in";
      default:
        return "";
    }
  };

  const renderContent = () => {
    switch (popup.template) {
      case "lead_capture":
        return (
          <div className="space-y-4">
            {popup.title && (
              <h2 className="text-2xl font-bold" style={{ color: popup.text_color }}>
                {popup.title}
              </h2>
            )}
            {popup.subtitle && (
              <p className="text-sm opacity-80" style={{ color: popup.text_color }}>
                {popup.subtitle}
              </p>
            )}
            <div className="space-y-3">
              <Input 
                placeholder="Votre email" 
                className="bg-white/90 border-0"
              />
              <Button 
                className="w-full font-semibold"
                style={{ backgroundColor: popup.accent_color }}
              >
                S'inscrire
              </Button>
            </div>
          </div>
        );
      
      case "promotion":
        return (
          <div className="space-y-4 text-center">
            {popup.badge_text && (
              <Badge 
                className="text-white font-bold px-4 py-1"
                style={{ backgroundColor: popup.badge_color }}
              >
                {popup.badge_text}
              </Badge>
            )}
            {popup.title && (
              <h2 className="text-3xl font-bold" style={{ color: popup.text_color }}>
                {popup.title}
              </h2>
            )}
            {popup.subtitle && (
              <p className="text-lg" style={{ color: popup.text_color }}>
                {popup.subtitle}
              </p>
            )}
            <Button 
              size="lg"
              className="font-semibold mt-4"
              style={{ backgroundColor: popup.accent_color }}
            >
              Profiter de l'offre
            </Button>
          </div>
        );
      
      case "information":
        return (
          <div className="space-y-4">
            {popup.title && (
              <h2 className="text-xl font-bold" style={{ color: popup.text_color }}>
                {popup.title}
              </h2>
            )}
            {popup.subtitle && (
              <p style={{ color: popup.text_color }}>
                {popup.subtitle}
              </p>
            )}
            <Button 
              variant="outline"
              className="font-medium"
              style={{ 
                borderColor: popup.accent_color, 
                color: popup.accent_color 
              }}
            >
              Compris
            </Button>
          </div>
        );
      
      case "fullscreen":
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-6 text-center p-8">
            {popup.badge_text && (
              <Badge 
                className="text-white font-bold px-6 py-2 text-lg"
                style={{ backgroundColor: popup.badge_color }}
              >
                {popup.badge_text}
              </Badge>
            )}
            {popup.title && (
              <h2 className="text-4xl md:text-6xl font-bold" style={{ color: popup.text_color }}>
                {popup.title}
              </h2>
            )}
            {popup.subtitle && (
              <p className="text-xl md:text-2xl max-w-2xl" style={{ color: popup.text_color }}>
                {popup.subtitle}
              </p>
            )}
            <div className="flex gap-4 mt-8">
              <Button 
                size="lg"
                className="font-semibold px-8"
                style={{ backgroundColor: popup.accent_color }}
              >
                Découvrir
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="font-semibold px-8"
                style={{ 
                  borderColor: popup.text_color, 
                  color: popup.text_color 
                }}
              >
                Plus tard
              </Button>
            </div>
          </div>
        );
      
      case "parcours_projet":
        return (
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center space-y-1">
              {popup.badge_text && (
                <Badge 
                  className="text-white font-medium px-3 py-1 text-xs mb-2"
                  style={{ backgroundColor: popup.accent_color }}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {popup.badge_text}
                </Badge>
              )}
              {popup.title && (
                <h2 
                  className="text-xl font-bold leading-tight" 
                  style={{ color: popup.text_color }}
                >
                  {popup.title}
                </h2>
              )}
              {popup.subtitle && (
                <p 
                  className="text-xs opacity-70" 
                  style={{ color: popup.text_color }}
                >
                  {popup.subtitle}
                </p>
              )}
            </div>

            {/* 4 Options Grid - Preview version */}
            <div className="grid grid-cols-2 gap-3">
              {/* Option 1 */}
              <div className="p-3 rounded-lg border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-slate-800">Demande de contact</h3>
                    <p className="text-[10px] text-slate-500">Particulier ou professionnel</p>
                  </div>
                </div>
              </div>

              {/* Option 2 */}
              <div className="p-3 rounded-lg border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-slate-800">Simulation en ligne</h3>
                    <p className="text-[10px] text-slate-500">Éligibilité, primes, travaux</p>
                  </div>
                </div>
              </div>

              {/* Option 3 */}
              <div className="p-3 rounded-lg border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-slate-800">Lire les guides</h3>
                    <p className="text-[10px] text-slate-500">Solaire, chauffage, isolation...</p>
                  </div>
                </div>
              </div>

              {/* Option 4 */}
              <div className="p-3 rounded-lg border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-slate-800">Chercher un installateur</h3>
                    <p className="text-[10px] text-slate-500">Près de chez moi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
      {/* Simulated page content */}
      <div className="absolute inset-0 p-8 opacity-30">
        <div className="h-12 w-48 bg-gray-400 rounded mb-8" />
        <div className="h-6 w-full max-w-xl bg-gray-300 rounded mb-4" />
        <div className="h-6 w-full max-w-md bg-gray-300 rounded mb-4" />
        <div className="h-6 w-full max-w-lg bg-gray-300 rounded mb-8" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-32 bg-gray-300 rounded" />
          <div className="h-32 bg-gray-300 rounded" />
          <div className="h-32 bg-gray-300 rounded" />
        </div>
      </div>

      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black transition-opacity"
        style={{ opacity: popup.overlay_opacity / 100 }}
      />

      {/* Popup */}
      <div
        className={`absolute ${getPositionClasses()} ${getSizeClasses()} ${getAnimationClasses()} 
          ${popup.size !== "fullscreen" ? "rounded-xl shadow-2xl p-6" : ""} overflow-hidden`}
        style={{
          backgroundColor: popup.background_color,
          backgroundImage: popup.background_image ? `url(${popup.background_image})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Close button */}
        {popup.show_close_button && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-black/10 transition-colors z-10"
            style={{ color: popup.text_color }}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className={popup.size === "fullscreen" ? "h-full" : ""}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}