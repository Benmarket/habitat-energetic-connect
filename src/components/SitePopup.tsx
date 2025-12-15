import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

type Popup = {
  id: string;
  name: string;
  is_active: boolean;
  target_page: string;
  form_id: string | null;
  delay_seconds: number;
  frequency: string;
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

type FormConfig = {
  id: string;
  name: string;
  form_identifier: string;
  fields_schema: any;
};

export default function SitePopup() {
  const location = useLocation();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch active popup for current page
  const { data: popup } = useQuery({
    queryKey: ["active-popup", location.pathname],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popups")
        .select("*")
        .eq("target_page", location.pathname)
        .eq("is_active", true)
        .single();
      
      if (error) {
        if (error.code === "PGRST116") return null; // No popup found
        throw error;
      }
      return data as Popup;
    },
  });

  // Fetch form if popup has one
  const { data: form } = useQuery({
    queryKey: ["popup-form", popup?.form_id],
    queryFn: async () => {
      if (!popup?.form_id) return null;
      const { data, error } = await supabase
        .from("form_configurations")
        .select("*")
        .eq("id", popup.form_id)
        .single();
      
      if (error) throw error;
      return data as FormConfig;
    },
    enabled: !!popup?.form_id,
  });

  useEffect(() => {
    if (!popup) {
      setIsVisible(false);
      return;
    }

    // Check frequency
    const storageKey = `popup_${popup.id}_shown`;
    
    if (popup.frequency === "once") {
      const wasShown = localStorage.getItem(storageKey);
      if (wasShown) return;
    } else if (popup.frequency === "session") {
      const wasShown = sessionStorage.getItem(storageKey);
      if (wasShown) return;
    }

    // Show popup after delay
    const timer = setTimeout(() => {
      setIsAnimating(true);
      setIsVisible(true);
      
      // Store that popup was shown
      if (popup.frequency === "once") {
        localStorage.setItem(storageKey, "true");
      } else if (popup.frequency === "session") {
        sessionStorage.setItem(storageKey, "true");
      }
    }, popup.delay_seconds * 1000);

    return () => clearTimeout(timer);
  }, [popup]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("form_submissions")
        .insert([{
          form_id: form.id,
          data: formData,
        }]);

      if (error) throw error;

      toast({ title: "Merci !", description: "Votre demande a bien été envoyée." });
      handleClose();
    } catch (error) {
      toast({ 
        title: "Erreur", 
        description: "Une erreur est survenue",
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible || !popup) return null;

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
    if (!isAnimating) return "opacity-0 scale-95";
    
    switch (popup.animation) {
      case "fade":
        return "animate-fade-in";
      case "slide-up":
        return "animate-[slideUp_0.3s_ease-out_forwards]";
      case "slide-down":
        return "animate-[slideDown_0.3s_ease-out_forwards]";
      case "scale":
        return "animate-scale-in";
      default:
        return "animate-fade-in";
    }
  };

  const renderFormFields = () => {
    if (!form?.fields_schema) return null;
    
    const fields = Array.isArray(form.fields_schema) ? form.fields_schema : [];
    
    return fields.map((field: any, index: number) => (
      <Input
        key={index}
        placeholder={field.label || field.name}
        type={field.type || "text"}
        required={field.required}
        value={formData[field.name] || ""}
        onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
        className="bg-white/90 border-0"
      />
    ));
  };

  const renderContent = () => {
    switch (popup.template) {
      case "lead_capture":
        return (
          <form onSubmit={handleSubmit} className="space-y-4">
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
              {form ? renderFormFields() : (
                <Input 
                  placeholder="Votre email" 
                  type="email"
                  className="bg-white/90 border-0"
                  value={formData.email || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              )}
              <Button 
                type="submit"
                className="w-full font-semibold text-white"
                style={{ backgroundColor: popup.accent_color }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Envoi..." : "S'inscrire"}
              </Button>
            </div>
          </form>
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
              className="font-semibold mt-4 text-white"
              style={{ backgroundColor: popup.accent_color }}
              onClick={handleClose}
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
              onClick={handleClose}
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
                className="font-semibold px-8 text-white"
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
                onClick={handleClose}
              >
                Plus tard
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${isAnimating ? "opacity-100" : "opacity-0"}`}
        style={{ opacity: isAnimating ? popup.overlay_opacity / 100 : 0 }}
        onClick={handleClose}
      />

      {/* Popup */}
      <div
        className={`fixed ${getPositionClasses()} ${getSizeClasses()} ${getAnimationClasses()} 
          ${popup.size !== "fullscreen" ? "rounded-xl shadow-2xl p-6" : ""} overflow-hidden transition-all duration-300`}
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
            onClick={handleClose}
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