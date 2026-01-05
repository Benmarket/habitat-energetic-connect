import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, Mail, Sparkles, CheckCircle2, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Popup = {
  id: string;
  name: string;
  is_active: boolean;
  target_page: string;
  target_categories: string[] | null;
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
  trigger_type: string;
  trigger_id: string | null;
};

type FormConfig = {
  id: string;
  name: string;
  form_identifier: string;
  fields_schema: any;
};

export default function SitePopup() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activePopup, setActivePopup] = useState<Popup | null>(null);

  // Check if we're on an article detail page
  const isArticlePage = location.pathname.startsWith("/actualites/") && location.pathname.split("/").length > 2;
  const articleSlug = isArticlePage ? location.pathname.split("/").pop() : null;
  const categorySlug = isArticlePage ? location.pathname.split("/")[2] : null;

  // Fetch article category if on article page
  const { data: articleCategory } = useQuery({
    queryKey: ["article-category", articleSlug],
    queryFn: async () => {
      if (!articleSlug) return null;
      
      const { data: article, error } = await supabase
        .from("posts")
        .select(`
          id,
          post_categories!inner(
            category:categories(slug)
          )
        `)
        .eq("slug", articleSlug)
        .eq("content_type", "actualite")
        .maybeSingle();
      
      if (error || !article) return categorySlug;
      
      const categories = article.post_categories as any[];
      return categories?.[0]?.category?.slug || categorySlug;
    },
    enabled: isArticlePage,
  });

  // Fetch AUTO popup for current page (existing behavior)
  const { data: autoPopup } = useQuery({
    queryKey: ["active-auto-popup", location.pathname, isArticlePage, articleCategory, categorySlug],
    queryFn: async () => {
      if (isArticlePage) {
        const { data, error } = await supabase
          .from("popups")
          .select("*")
          .eq("target_page", "/actualites")
          .eq("is_active", true)
          .eq("trigger_type", "auto")
          .maybeSingle();
        
        if (error) throw error;
        if (!data) return null;
        
        const popupData = data as Popup;
        const currentCategory = articleCategory || categorySlug;
        
        if (popupData.target_categories && popupData.target_categories.length > 0) {
          if (!currentCategory || !popupData.target_categories.includes(currentCategory)) {
            return null;
          }
        }
        
        return popupData;
      }
      
      const { data, error } = await supabase
        .from("popups")
        .select("*")
        .eq("target_page", location.pathname)
        .eq("is_active", true)
        .eq("trigger_type", "auto")
        .maybeSingle();
      
      if (error) throw error;
      return data as Popup | null;
    },
  });

  // Fetch all CLICK popups (globally available)
  const { data: clickPopups } = useQuery({
    queryKey: ["click-popups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popups")
        .select("*")
        .eq("is_active", true)
        .eq("trigger_type", "click")
        .not("trigger_id", "is", null);
      
      if (error) throw error;
      return data as Popup[];
    },
  });

  // Fetch form if active popup has one
  const { data: form } = useQuery({
    queryKey: ["popup-form", activePopup?.form_id],
    queryFn: async () => {
      if (!activePopup?.form_id) return null;
      const { data, error } = await supabase
        .from("form_configurations")
        .select("*")
        .eq("id", activePopup.form_id)
        .maybeSingle();
      
      if (error) throw error;
      return data as FormConfig | null;
    },
    enabled: !!activePopup?.form_id,
  });

  // Function to show a popup
  const showPopup = useCallback((popup: Popup) => {
    const storageKey = `popup_${popup.id}_shown`;
    
    if (popup.frequency === "once") {
      const wasShown = localStorage.getItem(storageKey);
      if (wasShown) return;
    } else if (popup.frequency === "session") {
      const wasShown = sessionStorage.getItem(storageKey);
      if (wasShown) return;
    }

    setActivePopup(popup);
    setIsAnimating(true);
    setIsVisible(true);
    
    if (popup.frequency === "once") {
      localStorage.setItem(storageKey, "true");
    } else if (popup.frequency === "session") {
      sessionStorage.setItem(storageKey, "true");
    }
  }, []);

  // Handle AUTO popups (with delay)
  useEffect(() => {
    if (!autoPopup) {
      return;
    }

    const timer = setTimeout(() => {
      showPopup(autoPopup);
    }, autoPopup.delay_seconds * 1000);

    return () => clearTimeout(timer);
  }, [autoPopup, showPopup]);

  // Handle CLICK popups (listen for custom events)
  useEffect(() => {
    const handleTriggerPopup = (event: CustomEvent<{ triggerId: string }>) => {
      const { triggerId } = event.detail;
      console.log("Trigger popup event received:", triggerId, "Available popups:", clickPopups);
      
      if (!clickPopups) {
        console.log("No clickPopups loaded yet");
        return;
      }
      
      const matchingPopup = clickPopups.find(p => p.trigger_id === triggerId);
      console.log("Matching popup found:", matchingPopup);
      if (matchingPopup) {
        showPopup(matchingPopup);
      }
    };

    window.addEventListener("trigger-popup", handleTriggerPopup as EventListener);
    
    return () => {
      window.removeEventListener("trigger-popup", handleTriggerPopup as EventListener);
    };
  }, [clickPopups, showPopup]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      setIsSuccess(false);
      setFormData({});
      setActivePopup(null);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setIsSubmitting(true);
    try {
      if (form.form_identifier === "newsletter") {
        const email = formData.email;
        if (!email || !email.includes("@")) {
          toast.error("Veuillez entrer une adresse email valide");
          setIsSubmitting(false);
          return;
        }

        const { data: existing } = await supabase
          .from("newsletter_subscribers")
          .select("email, status")
          .eq("email", email)
          .maybeSingle();

        if (existing) {
          if (existing.status === "active") {
            toast.info("Vous êtes déjà inscrit à notre newsletter !");
          } else {
            toast.info("Cette adresse était désinscrite.");
          }
          handleClose();
          return;
        }

        const { error } = await supabase
          .from("newsletter_subscribers")
          .insert({
            email,
            source: "popup",
            status: "active"
          });

        if (error) throw error;
        
        setIsSuccess(true);
        toast.success("Inscription réussie !");
        setTimeout(handleClose, 2000);
      } else {
        const { error } = await supabase
          .from("form_submissions")
          .insert([{
            form_id: form.id,
            data: formData,
          }]);

        if (error) throw error;
        
        setIsSuccess(true);
        toast.success("Merci ! Votre demande a bien été envoyée.");
        setTimeout(handleClose, 2000);
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible || !activePopup) return null;

  const getSizeClasses = () => {
    switch (activePopup.size) {
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
    if (activePopup.size === "fullscreen") return "inset-0";
    
    switch (activePopup.position) {
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
    
    switch (activePopup.animation) {
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
    
    return fields.map((field: any, index: number) => {
      // Handle select fields
      if (field.type === "select" && field.options) {
        return (
          <div key={index} className="space-y-2">
            <Label className="text-sm font-medium" style={{ color: activePopup.text_color }}>
              {field.label}
            </Label>
            <Select
              value={formData[field.name] || ""}
              onValueChange={(value) => setFormData(prev => ({ ...prev, [field.name]: value }))}
              required={field.required}
            >
              <SelectTrigger className="h-12 bg-white border-2 border-gray-200 focus:border-primary rounded-lg text-base">
                <SelectValue placeholder={field.placeholder || `Sélectionnez ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option: any, optIndex: number) => (
                  <SelectItem key={optIndex} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }
      
      // Handle radio fields
      if (field.type === "radio" && field.options) {
        return (
          <div key={index} className="space-y-3">
            <Label className="text-sm font-medium" style={{ color: activePopup.text_color }}>
              {field.label}
            </Label>
            <RadioGroup
              value={formData[field.name] || ""}
              onValueChange={(value) => setFormData(prev => ({ ...prev, [field.name]: value }))}
              className="flex flex-wrap gap-4"
            >
              {field.options.map((option: any, optIndex: number) => (
                <div key={optIndex} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={option.value} 
                    id={`${field.name}-${option.value}`}
                    className="border-2 border-gray-300"
                  />
                  <Label 
                    htmlFor={`${field.name}-${option.value}`}
                    className="text-sm cursor-pointer"
                    style={{ color: activePopup.text_color }}
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
      }
      
      // Default: text/email/tel input
      return (
        <div key={index} className="space-y-2">
          <Label className="text-sm font-medium" style={{ color: activePopup.text_color }}>
            {field.label}
          </Label>
          <Input
            placeholder={field.placeholder || field.label || field.name}
            type={field.type || "text"}
            required={field.required}
            value={formData[field.name] || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
            className="h-12 bg-white border-2 border-gray-200 focus:border-primary rounded-lg text-base"
          />
        </div>
      );
    });
  };

  // Get appropriate success message based on form type
  const getSuccessContent = () => {
    if (form?.form_identifier === "aide-dossier") {
      return {
        icon: FileText,
        title: "Demande envoyée avec succès !",
        subtitle: "Un conseiller vous contactera dans les plus brefs délais pour vous accompagner dans la constitution de votre dossier d'aides."
      };
    }
    if (form?.form_identifier === "newsletter") {
      return {
        icon: CheckCircle2,
        title: "Merci pour votre inscription !",
        subtitle: "Vous recevrez bientôt nos actualités."
      };
    }
    return {
      icon: CheckCircle2,
      title: "Merci !",
      subtitle: "Votre demande a bien été envoyée. Nous vous répondrons rapidement."
    };
  };

  const renderContent = () => {
    if (isSuccess) {
      const successContent = getSuccessContent();
      const SuccessIcon = successContent.icon;
      
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${activePopup.accent_color}20` }}
          >
            <SuccessIcon className="w-10 h-10" style={{ color: activePopup.accent_color }} />
          </div>
          <h2 className="text-2xl font-bold text-center" style={{ color: activePopup.text_color }}>
            {successContent.title}
          </h2>
          <p className="text-center opacity-70 px-4" style={{ color: activePopup.text_color }}>
            {successContent.subtitle}
          </p>
        </div>
      );
    }

    switch (activePopup.template) {
      case "lead_capture":
        // Determine icon and button text based on form type
        const isAideDossier = form?.form_identifier === "aide-dossier";
        const FormIcon = isAideDossier ? FileText : Mail;
        const submitButtonText = isAideDossier ? "Envoyer ma demande" : "S'inscrire maintenant";
        const loadingText = isAideDossier ? "Envoi..." : "Inscription...";
        const footerText = isAideDossier 
          ? "Vos données sont utilisées uniquement pour traiter votre demande."
          : "En vous inscrivant, vous acceptez de recevoir nos communications.";
        
        return (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex justify-center mb-2">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                style={{ 
                  background: `linear-gradient(135deg, ${activePopup.accent_color}, ${activePopup.accent_color}dd)` 
                }}
              >
                <FormIcon className="w-7 h-7 text-white" />
              </div>
            </div>

            {activePopup.badge_text && (
              <div className="flex justify-center">
                <Badge 
                  className="text-white font-medium px-3 py-1 text-xs"
                  style={{ backgroundColor: activePopup.accent_color }}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {activePopup.badge_text}
                </Badge>
              </div>
            )}

            {activePopup.title && (
              <h2 
                className="text-2xl font-bold text-center leading-tight" 
                style={{ color: activePopup.text_color }}
              >
                {activePopup.title}
              </h2>
            )}
            
            {activePopup.subtitle && (
              <p 
                className="text-sm text-center opacity-70 leading-relaxed px-2" 
                style={{ color: activePopup.text_color }}
              >
                {activePopup.subtitle}
              </p>
            )}
            
            <div className="space-y-4 pt-2">
              {form ? renderFormFields() : (
                <Input 
                  placeholder="Votre adresse email" 
                  type="email"
                  required
                  className="h-12 bg-white border-2 border-gray-200 focus:border-primary rounded-lg text-base"
                  value={formData.email || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              )}
              <Button 
                type="submit"
                className="w-full h-12 font-semibold text-white text-base rounded-lg shadow-md hover:shadow-lg transition-all"
                style={{ 
                  backgroundColor: activePopup.accent_color,
                  boxShadow: `0 4px 14px ${activePopup.accent_color}40`
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {loadingText}
                  </span>
                ) : (
                  submitButtonText
                )}
              </Button>
            </div>

            <p 
              className="text-xs text-center opacity-50 pt-1" 
              style={{ color: activePopup.text_color }}
            >
              {footerText}
            </p>
          </form>
        );
      
      case "promotion":
        return (
          <div className="space-y-4 text-center">
            {activePopup.badge_text && (
              <Badge 
                className="text-white font-bold px-4 py-1"
                style={{ backgroundColor: activePopup.badge_color }}
              >
                {activePopup.badge_text}
              </Badge>
            )}
            {activePopup.title && (
              <h2 className="text-3xl font-bold" style={{ color: activePopup.text_color }}>
                {activePopup.title}
              </h2>
            )}
            {activePopup.subtitle && (
              <p className="text-lg" style={{ color: activePopup.text_color }}>
                {activePopup.subtitle}
              </p>
            )}
            <Button 
              size="lg"
              className="font-semibold mt-4 text-white"
              style={{ backgroundColor: activePopup.accent_color }}
              onClick={handleClose}
            >
              Profiter de l'offre
            </Button>
          </div>
        );
      
      case "information":
        return (
          <div className="space-y-4">
            {activePopup.title && (
              <h2 className="text-xl font-bold" style={{ color: activePopup.text_color }}>
                {activePopup.title}
              </h2>
            )}
            {activePopup.subtitle && (
              <p style={{ color: activePopup.text_color }}>
                {activePopup.subtitle}
              </p>
            )}
            <Button 
              variant="outline"
              className="font-medium"
              style={{ 
                borderColor: activePopup.accent_color, 
                color: activePopup.accent_color 
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
            {activePopup.badge_text && (
              <Badge 
                className="text-white font-bold px-6 py-2 text-lg"
                style={{ backgroundColor: activePopup.badge_color }}
              >
                {activePopup.badge_text}
              </Badge>
            )}
            {activePopup.title && (
              <h2 className="text-4xl md:text-6xl font-bold" style={{ color: activePopup.text_color }}>
                {activePopup.title}
              </h2>
            )}
            {activePopup.subtitle && (
              <p className="text-xl md:text-2xl max-w-2xl" style={{ color: activePopup.text_color }}>
                {activePopup.subtitle}
              </p>
            )}
            <div className="flex gap-4 mt-8">
              <Button 
                size="lg"
                className="font-semibold px-8 text-white"
                style={{ backgroundColor: activePopup.accent_color }}
              >
                Découvrir
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="font-semibold px-8"
                style={{ 
                  borderColor: activePopup.text_color, 
                  color: activePopup.text_color 
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
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? "opacity-100" : "opacity-0"}`}
        style={{ opacity: isAnimating ? activePopup.overlay_opacity / 100 : 0 }}
        onClick={handleClose}
      />

      {/* Popup */}
      <div
        className={`fixed ${getPositionClasses()} ${getSizeClasses()} ${getAnimationClasses()} 
          ${activePopup.size !== "fullscreen" ? "rounded-2xl shadow-2xl p-8" : ""} overflow-hidden transition-all duration-300`}
        style={{
          backgroundColor: activePopup.background_color,
          backgroundImage: activePopup.background_image ? `url(${activePopup.background_image})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Decorative gradient overlay */}
        {!activePopup.background_image && activePopup.size !== "fullscreen" && (
          <div 
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"
            style={{ backgroundColor: activePopup.accent_color }}
          />
        )}

        {/* Close button */}
        {activePopup.show_close_button && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors z-10"
            style={{ color: activePopup.text_color }}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className={`relative ${activePopup.size === "fullscreen" ? "h-full" : ""}`}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
