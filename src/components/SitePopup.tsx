import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
      
      if (!clickPopups) {
        return;
      }
      
      const matchingPopup = clickPopups.find(p => p.trigger_id === triggerId);
      if (matchingPopup) {
        showPopup(matchingPopup);
      }
    };

    // Handler pour les bandeaux CTA avec popupId (ouvre par ID de popup)
    const handleOpenPopup = (event: CustomEvent<{ popupId: string }>) => {
      const { popupId } = event.detail;
      
      if (!popupId) return;
      
      // Chercher le popup par son ID directement
      supabase
        .from("popups")
        .select("*")
        .eq("id", popupId)
        .eq("is_active", true)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching popup:", error);
            return;
          }
          if (data) {
            showPopup(data as Popup);
          }
        });
    };

    window.addEventListener("trigger-popup", handleTriggerPopup as EventListener);
    window.addEventListener("open-popup", handleOpenPopup as EventListener);
    
    return () => {
      window.removeEventListener("trigger-popup", handleTriggerPopup as EventListener);
      window.removeEventListener("open-popup", handleOpenPopup as EventListener);
    };
  }, [clickPopups, showPopup]);

  // Écouter les clics sur les éléments avec data-popup-trigger dans le DOM
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const popupTrigger = target.closest('[data-popup-trigger]');
      
      if (popupTrigger) {
        const popupId = popupTrigger.getAttribute('data-popup-trigger');
        if (popupId) {
          e.preventDefault();
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('open-popup', { 
            detail: { popupId } 
          }));
        }
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

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
        
        handleClose();
        
        // Récupérer le nom depuis le formData (fullName, nom, ou name)
        const userName = formData.fullName || formData.nom || formData.name || "";
        const params = new URLSearchParams();
        if (userName) params.set("name", userName);
        navigate(`/merci${params.toString() ? `?${params.toString()}` : ""}`);
      }
    } catch (error) {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible || !activePopup) return null;

  const getSizeClasses = () => {
    // For aide-dossier form, use a wider but shorter layout
    const isAideDossier = form?.form_identifier === "aide-dossier";
    if (isAideDossier) {
      return "max-w-4xl";
    }
    
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
        
        // Check if this is aide-dossier form for 2-column layout
        const isAideDossierForm = form?.form_identifier === "aide-dossier";
        
        if (isAideDossierForm) {
          // 2-column layout for aide-dossier (more compact/horizontal)
          return (
            <form onSubmit={handleSubmit} className="flex gap-8">
              {/* Left column - Header */}
              <div className="flex-1 flex flex-col justify-center items-center text-center border-r border-gray-200 pr-8">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg mb-4"
                  style={{ 
                    background: `linear-gradient(135deg, ${activePopup.accent_color}, ${activePopup.accent_color}dd)` 
                  }}
                >
                  <FormIcon className="w-8 h-8 text-white" />
                </div>
                
                {activePopup.badge_text && (
                  <Badge 
                    className="text-white font-medium px-3 py-1 text-xs mb-4"
                    style={{ backgroundColor: activePopup.accent_color }}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {activePopup.badge_text}
                  </Badge>
                )}
                
                {activePopup.title && (
                  <h2 
                    className="text-xl font-bold leading-tight mb-3" 
                    style={{ color: activePopup.text_color }}
                  >
                    {activePopup.title}
                  </h2>
                )}
                
                {activePopup.subtitle && (
                  <p 
                    className="text-sm opacity-70 leading-relaxed" 
                    style={{ color: activePopup.text_color }}
                  >
                    {activePopup.subtitle}
                  </p>
                )}
              </div>
              
              {/* Right column - Form fields */}
              <div className="flex-1 space-y-3">
                {renderFormFields()}
                
                <Button 
                  type="submit"
                  className="w-full h-11 font-semibold text-white text-base rounded-lg shadow-md hover:shadow-lg transition-all mt-4"
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
                
                <p 
                  className="text-xs text-center opacity-50" 
                  style={{ color: activePopup.text_color }}
                >
                  {footerText}
                </p>
              </div>
            </form>
          );
        }
        
        // Default single column layout for other forms
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
      
      case "parcours_projet":
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              {activePopup.badge_text && (
                <Badge 
                  className="text-white font-medium px-3 py-1 text-xs"
                  style={{ backgroundColor: activePopup.accent_color }}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {activePopup.badge_text}
                </Badge>
              )}
              {activePopup.title && (
                <h2 
                  className="text-2xl font-bold leading-tight" 
                  style={{ color: activePopup.text_color }}
                >
                  {activePopup.title}
                </h2>
              )}
              {activePopup.subtitle && (
                <p 
                  className="text-sm opacity-70" 
                  style={{ color: activePopup.text_color }}
                >
                  {activePopup.subtitle}
                </p>
              )}
            </div>

            {/* 4 Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Demande de contact */}
              <button
                onClick={() => {
                  handleClose();
                  navigate("/#eligibilite");
                }}
                className="group relative p-5 rounded-xl border-2 border-slate-200 hover:border-blue-400 bg-gradient-to-br from-white to-slate-50 hover:from-blue-50 hover:to-white transition-all duration-300 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                      Demande de contact
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Particulier ou professionnel
                    </p>
                    <p className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Rappel sous 24-48h
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 2: Simulation en ligne */}
              <button
                onClick={() => {
                  handleClose();
                  navigate("/#eligibilite");
                }}
                className="group relative p-5 rounded-xl border-2 border-slate-200 hover:border-emerald-400 bg-gradient-to-br from-white to-slate-50 hover:from-emerald-50 hover:to-white transition-all duration-300 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      Simulation en ligne
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Éligibilité, primes, travaux
                    </p>
                    <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Résultats instantanés
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 3: Lire les guides */}
              <button
                onClick={() => {
                  handleClose();
                  navigate("/guides");
                }}
                className="group relative p-5 rounded-xl border-2 border-slate-200 hover:border-violet-400 bg-gradient-to-br from-white to-slate-50 hover:from-violet-50 hover:to-white transition-all duration-300 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">
                      Lire les guides
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Solaire, chauffage, isolation...
                    </p>
                    <p className="text-xs text-violet-600 font-medium mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Se projeter pour mieux comprendre
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 4: Chercher un installateur */}
              <button
                onClick={() => {
                  handleClose();
                  window.dispatchEvent(new CustomEvent('trigger-popup', { 
                    detail: { triggerId: 'find-professional-cta' } 
                  }));
                }}
                className="group relative p-5 rounded-xl border-2 border-slate-200 hover:border-amber-400 bg-gradient-to-br from-white to-slate-50 hover:from-amber-50 hover:to-white transition-all duration-300 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 group-hover:text-amber-700 transition-colors">
                      Chercher un installateur
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Près de chez moi
                    </p>
                    <p className="text-xs text-amber-600 font-medium mt-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Consultez les offres
                    </p>
                  </div>
                </div>
              </button>
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
